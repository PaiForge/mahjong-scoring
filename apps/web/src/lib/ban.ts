import 'server-only';

import { getProfileCoreByUserId } from './db/queries';

/**
 * ユーザーが BAN されているかチェックする。
 * `getProfileCoreByUserId` の React cache を共有し、同一リクエスト内で
 * プロフィール取得と BAN チェックが重複クエリを発行しない。
 * BAN チェック
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  const profile = await getProfileCoreByUserId(userId);
  return profile?.bannedAt != null;
}
