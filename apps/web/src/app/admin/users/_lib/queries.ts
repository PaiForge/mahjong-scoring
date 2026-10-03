import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { findUserIdsMatching } from "@/app/admin/_lib/log-query-helpers";
import { DEFAULT_PAGE_SIZE, getPaginationData } from "@/lib/pagination";
import { listAllAuthUsers } from "@/lib/supabase/list-all-auth-users";

/** ユーザー一覧の 1 ページ分 */
interface UsersPageData {
  readonly users: readonly User[];
  readonly totalCount: number;
}

/**
 * ユーザー一覧の 1 ページ分を取得する
 * ユーザー一覧取得
 *
 * 検索なしなら Auth の `listUsers` をそのままページングする。検索ありのときは
 * Auth の Admin API が属性での絞り込みを持たないため、全ユーザーを取得して
 * 合致したものを JS 側で切り出す（並び順は `listUsers` と同じ）。
 *
 * @param query - 検索文字列（trim 済み）。空文字なら検索なし
 */
export async function fetchUsersPageData(
  adminClient: SupabaseClient,
  page: number,
  query: string,
): Promise<UsersPageData> {
  if (!query) {
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

  const allUsers = await listAllAuthUsers(adminClient);
  const matchedIds = new Set(await findUserIdsMatching(allUsers, query));
  const matchedUsers = allUsers.filter((u) => matchedIds.has(u.id));
  const { offset, limit } = getPaginationData(page, matchedUsers.length);

  return {
    users: matchedUsers.slice(offset, offset + limit),
    totalCount: matchedUsers.length,
  };
}
