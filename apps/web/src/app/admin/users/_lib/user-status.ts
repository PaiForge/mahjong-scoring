import type { Profile } from "@/lib/db";

/**
 * 管理画面でのアカウントの状態
 * ユーザーステータス
 *
 * - `provisional` — 仮登録。認証ユーザーはあるがプロフィールが無い
 *   （メール確認待ち、またはユーザー名の設定を終えていない）
 * - `deleted` — 退会済み。プロフィールは username を残して匿名化されている
 * - `banned` — BAN 済み
 * - `active` — 有効
 */
export const UserStatus = {
  Provisional: "provisional",
  Deleted: "deleted",
  Banned: "banned",
  Active: "active",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/**
 * プロフィール行からアカウントの状態を決める
 * ユーザーステータス解決
 *
 * 退会を BAN より先に見る。BAN 中に退会したアカウントはもう戻らないため、
 * 「BAN 済み」と出して解除の対象に見せない。
 *
 * @param profile - 対象ユーザーのプロフィール。無ければ仮登録
 */
export function resolveUserStatus(
  profile: Pick<Profile, "bannedAt" | "deletedAt"> | undefined,
): UserStatus {
  if (!profile) return UserStatus.Provisional;
  if (profile.deletedAt != null) return UserStatus.Deleted;
  if (profile.bannedAt != null) return UserStatus.Banned;
  return UserStatus.Active;
}
