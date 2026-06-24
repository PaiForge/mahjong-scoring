import 'server-only';

import { listAllAuthUsers } from '@/lib/supabase/list-all-auth-users';

import { type DailyCount, aggregateByDay } from './aggregate-by-day';

/**
 * auth.users.created_at から新規ユーザー登録数を日次集計する。
 *
 * Supabase Admin API は日付範囲フィルタに非対応のため、`/admin/users` でも使う
 * 共通ページャ `listAllAuthUsers` で全ユーザーを取得し、`aggregateByDay`
 *（独自テスト済みの純粋関数）で UTC 日単位にバケットする。
 *
 * // TODO: ユーザー数が ~5000 を超えたら DB レベルの集計に置き換える。
 */
export async function getNewUsersPerDay(
  startDate: string,
  endDate: string,
): Promise<{ daily: DailyCount[]; total: number }> {
  const allUsers = await listAllAuthUsers();
  return aggregateByDay(allUsers, (u) => u.created_at, { startDate, endDate });
}
