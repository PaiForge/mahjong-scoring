import type { SupabaseClient } from "@supabase/supabase-js";
import { desc, eq, sql } from "drizzle-orm";

import { benefitGrants, db, type BenefitGrant, type Profile } from "@/lib/db";
import type { BenefitGrantCategory } from "@/lib/entitlements/benefit-grant-categories";
import { DEFAULT_PAGE_SIZE, resolvePagination } from "@/lib/pagination";
import { getAuthUserEmails } from "@/lib/supabase/get-auth-user-emails";

import { buildProfileMap } from "../../_lib/log-query-helpers";

/** 特典付与一覧ページのデータ */
interface BenefitGrantsPageData {
  readonly grants: readonly BenefitGrant[];
  readonly currentPage: number;
  readonly totalPages: number;
  /** 対象と付与者の両方を引ける */
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

/**
 * 特典付与一覧ページのデータを取得する（新しい順・ページ送り）
 * 付与一覧取得
 *
 * 絞り込みは種別だけ（`category` が undefined なら全件）。種別の列ができる前の行は
 * NULL なので、種別を選ぶと出ず「すべて」にだけ出る。利用者での絞り込みは持たない —
 * 付与は運営者が手で置くものなので件数は少なく、必要になったら監査ログと同じ
 * `buildUserFilterCondition` を足す。
 */
export async function fetchBenefitGrantsPageData(
  adminClient: SupabaseClient,
  page: number,
  category: BenefitGrantCategory | undefined,
): Promise<BenefitGrantsPageData> {
  const filter =
    category === undefined ? undefined : eq(benefitGrants.category, category);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(benefitGrants)
    .where(filter);

  const pagination = resolvePagination(
    page,
    Number(countResult.count),
    DEFAULT_PAGE_SIZE,
  );

  const grants = await db
    .select()
    .from(benefitGrants)
    .where(filter)
    .orderBy(desc(benefitGrants.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset);

  const userIds = [
    ...new Set(grants.flatMap((grant) => [grant.userId, grant.grantedBy])),
  ];
  // 1 ページ分の ID だけ引く。メールで検索する機能が無いので全件は要らない
  const [emailMap, profileMap] = await Promise.all([
    getAuthUserEmails(userIds, adminClient),
    buildProfileMap(userIds),
  ]);

  return {
    grants,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    profileMap,
    emailMap,
  };
}
