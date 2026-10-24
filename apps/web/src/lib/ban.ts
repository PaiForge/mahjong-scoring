import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db, moderationActions } from "./db";
import {
  getProfileCoreByUserId,
  hasAccountDeletionRequest,
} from "./db/queries";

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
 * - `deleting` — 退会を受け付けた（処理中または完了）。退会の工程は
 *   サーバーが最後まで進めるので（`lib/users/delete-account.ts`）、その途中で
 *   ログインがまだ生きていても、書き込みの入口はこれを未認証として扱う
 */
export type AccountStanding = "active" | "banned" | "deleting";

/**
 * アカウントの状態を判定する。退会と BAN が重なったら退会を優先する
 * （退会を受け付けた人には、BAN より退会の扱いを見せる）。
 * アカウント状態判定
 *
 * プロフィールと退会の要求は並べて読む（往復は 1 回分の待ち）。
 * {@link isUserBanned} とプロフィールのキャッシュを共有する。
 */
export async function getAccountStanding(
  userId: string,
): Promise<AccountStanding> {
  const [profile, deletionRequested] = await Promise.all([
    getProfileCoreByUserId(userId),
    hasAccountDeletionRequest(userId),
  ]);
  // deletedAt だけが付いた行は、要求の表より前の退会（Auth も無効化済み）
  if (deletionRequested || profile?.deletedAt != null) return "deleting";
  if (profile?.bannedAt != null) return "banned";
  return "active";
}

/**
 * 最新の BAN の理由（運営が BAN のときに書いたもの）。書かれていなければ null
 * BAN 理由取得
 *
 * web の BAN のページとアプリの BAN の知らせが同じものを出す。
 */
export async function getLatestBanReason(
  userId: string,
): Promise<string | null> {
  const [latestBan] = await db
    .select({ reason: moderationActions.reason })
    .from(moderationActions)
    .where(
      and(
        eq(moderationActions.targetId, userId),
        eq(moderationActions.action, "ban"),
      ),
    )
    .orderBy(desc(moderationActions.createdAt))
    .limit(1);
  return latestBan?.reason ?? null;
}
