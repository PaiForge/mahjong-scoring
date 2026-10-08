import "server-only";

import { getProfileCoreByUserId } from "./db/queries";

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

/**
 * アカウントの状態（書き込みを受け付けてよいか）
 *
 * - `active` — 受け付ける（プロフィール未作成もここ）
 * - `banned` — BAN 済み
 * - `deleted` — 退会済み。退会は Auth の削除を最後に行うので
 *   （`lib/users/delete-account.ts`）、その手前で失敗すると DB は消えたまま
 *   ログインだけが生きている状態が残る。書き込みの入口はこれを未認証として扱う
 */
export type AccountStanding = "active" | "banned" | "deleted";

/**
 * アカウントの状態を 1 回の読み込みで判定する。BAN と退会済みが重なったら BAN。
 * アカウント状態判定
 *
 * {@link isUserBanned} と同じキャッシュを共有する。
 */
export async function getAccountStanding(
  userId: string,
): Promise<AccountStanding> {
  const profile = await getProfileCoreByUserId(userId);
  if (profile?.bannedAt != null) return "banned";
  if (profile?.deletedAt != null) return "deleted";
  return "active";
}
