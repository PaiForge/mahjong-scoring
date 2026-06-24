import 'server-only';

import type { SupabaseClient, User } from '@supabase/supabase-js';

import { createAdminClient } from './admin';

const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_PAGES = 100;

/**
 * Supabase Auth の `admin.listUsers` を尽きるまで辿り、全ページを連結して返す。
 *
 * Supabase Admin API は日付範囲・属性でのフィルタに対応しないため、集計系の処理
 * （ダッシュボードの新規ユーザー日次集計など）は全ユーザーを取得して JS 側で
 * バケットする。ページサイズ・最大ページ数のガードを 1 箇所に集約する。
 *
 * 途中ページがエラーを返した場合は、取得済みページで黙って打ち切らず throw する。
 * デフォルト（1000 件/ページ・最大 100 ページ ≒ 10 万ユーザー）は現状の規模向け。
 * 規模が超過したらこのヘルパーが見直しの単一窓口となる。
 */
export async function listAllAuthUsers(
  adminClient: SupabaseClient = createAdminClient(),
  options?: { readonly pageSize?: number; readonly maxPages?: number },
): Promise<User[]> {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;

  const allUsers: User[] = [];
  let page = 1;

  while (page <= maxPages) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: pageSize,
    });

    if (error) {
      throw new Error(`Failed to fetch users (page ${page}): ${error.message}`);
    }

    const users = data?.users ?? [];
    allUsers.push(...users);

    if (users.length < pageSize) break;
    page++;
  }

  return allUsers;
}
