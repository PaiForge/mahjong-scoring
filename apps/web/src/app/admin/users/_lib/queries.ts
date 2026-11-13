import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { inArray } from "drizzle-orm";

import { findUserIdsMatching } from "@/app/admin/_lib/log-query-helpers";
import { planStatusOf, type PlanStatus } from "@/lib/billing/plan-status";
import { benefitGrants, db, purchases } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, resolvePagination } from "@/lib/pagination";
import { listAllAuthUsers } from "@/lib/supabase/list-all-auth-users";

/** ユーザー一覧の 1 ページ分 */
interface UsersPageData {
  readonly users: readonly User[];
  readonly totalCount: number;
  /** 範囲外の要求を最終ページに丸めた後のページ番号 */
  readonly currentPage: number;
  readonly totalPages: number;
}

/**
 * ユーザー一覧の 1 ページ分を取得する
 * ユーザー一覧取得
 *
 * 検索なしなら Auth の `listUsers` をそのままページングする。検索ありのときは
 * Auth の Admin API が属性での絞り込みを持たないため、全ユーザーを取得して
 * 合致したものを JS 側で切り出す（並び順は `listUsers` と同じ）。
 *
 * 範囲外のページ（件数が減った後の古いリンク）は最終ページに丸める。
 * `listUsers` は件数を行と同じ応答で返すため、要求されたページのまま引き、
 * 範囲外だったと分かったときだけ丸めたページを引き直す。
 *
 * @param query - 検索文字列（trim 済み）。空文字なら検索なし
 */
export async function fetchUsersPageData(
  adminClient: SupabaseClient,
  page: number,
  query: string,
): Promise<UsersPageData> {
  if (!query) {
    const first = await listAuthUsersPage(adminClient, page);
    const pagination = resolvePagination(page, first.totalCount);
    const { users, totalCount } =
      pagination.currentPage === page
        ? first
        : await listAuthUsersPage(adminClient, pagination.currentPage);
    return {
      users,
      totalCount,
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
    };
  }

  const allUsers = await listAllAuthUsers(adminClient);
  const matchedIds = new Set(await findUserIdsMatching(allUsers, query));
  const matchedUsers = allUsers.filter((u) => matchedIds.has(u.id));
  const { offset, limit, currentPage, totalPages } = resolvePagination(
    page,
    matchedUsers.length,
  );

  return {
    users: matchedUsers.slice(offset, offset + limit),
    totalCount: matchedUsers.length,
    currentPage,
    totalPages,
  };
}

/** Auth の `listUsers` の 1 ページ分を引く */
async function listAuthUsersPage(
  adminClient: SupabaseClient,
  page: number,
): Promise<{ readonly users: readonly User[]; readonly totalCount: number }> {
  const { data, error } = await adminClient.auth.admin.listUsers({
    page,
    perPage: DEFAULT_PAGE_SIZE,
  });
  if (error) {
    // Next.js error boundary に委任する意図的な throw
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
  return { users: data.users ?? [], totalCount: data.total ?? 0 };
}

/**
 * 一覧の 1 ページ分の利用者について、いまのプラン状況を引く
 * プラン状況一括取得
 *
 * ユーザー一覧の「プラン」列のため。購入の Pro と付与の VIP を一覧で見分けられないと、
 * 詳細を 1 人ずつ開くことになる。
 *
 * N+1 にしないため、`purchases` と `benefit_grants` をそのページの利用者分だけ
 * `inArray` で 1 回ずつ引く（1 ページ 2 クエリ）。有効性（取り消し・期限・開始前）の
 * 条件は SQL に書き直さず、引いた行をそのまま利用者ごとに `planStatusOf` へ渡す —
 * 判定の規則を `planStatusOf` の 1 か所に保ち、詳細ページ・マイページと同じ状態を出すため。
 * 取り消し済み・期限切れの行も引くが、1 ページ分の利用者の履歴なので量は小さい。
 *
 * @param userIds - そのページの利用者の ID。空なら DB を引かずに空の Map を返す
 * @returns 渡した利用者全員の状態（行が無い利用者は `free`）
 */
export async function fetchPlanStatusMap(
  userIds: readonly string[],
  now: Date,
): Promise<ReadonlyMap<string, PlanStatus>> {
  if (userIds.length === 0) return new Map();

  const ids = [...userIds];
  const [purchaseRows, grantRows] = await Promise.all([
    db.select().from(purchases).where(inArray(purchases.userId, ids)),
    db.select().from(benefitGrants).where(inArray(benefitGrants.userId, ids)),
  ]);

  const purchasesByUser = groupByUserId(purchaseRows);
  const grantsByUser = groupByUserId(grantRows);
  return new Map(
    userIds.map((userId) => [
      userId,
      planStatusOf(
        purchasesByUser.get(userId) ?? [],
        grantsByUser.get(userId) ?? [],
        now,
      ),
    ]),
  );
}

/** 行を `userId` ごとに束ねる */
function groupByUserId<Row extends { readonly userId: string }>(
  rows: readonly Row[],
): ReadonlyMap<string, readonly Row[]> {
  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const list = grouped.get(row.userId);
    if (list) {
      list.push(row);
    } else {
      grouped.set(row.userId, [row]);
    }
  }
  return grouped;
}
