import type { User } from "@supabase/supabase-js";

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
 * Supabase Auth 側で BAN 中かを判定する
 * Auth側BAN判定
 *
 * `banned_until` は BAN の期限で、解除すると null か未設定になる。
 * 永久 BAN は 100 年先の期限として入っている（`PERMANENT_BAN_DURATION`）。
 */
export function isAuthBanned(
  authUser: Pick<User, "banned_until">,
  now: Date,
): boolean {
  const until = authUser.banned_until;
  if (!until) return false;
  const untilDate = new Date(until);
  return !Number.isNaN(untilDate.getTime()) && untilDate > now;
}

/**
 * プロフィール行と認証ユーザーからアカウントの状態を決める
 * ユーザーステータス解決
 *
 * BAN は `profiles.bannedAt` と Auth の `banned_until` のどちらかにあれば
 * BAN 済みとする。仮登録（プロフィール無し）を BAN すると Auth 側にしか
 * 残らず、プロフィールだけを見ると「仮登録」のまま解除の入口が出ない。
 * Auth の BAN はサインインを止めるのでプロフィールを作って抜け出すことも
 * できず、管理者が解除できる唯一の経路がこの判定になる。
 * また BAN / 解除のロールバックが片側だけ失敗して食い違ったときも、
 * どちらかに残っていれば解除の入口を出す（OR で見る理由）。
 *
 * 退会を BAN より先に見る。BAN 中に退会したアカウントはもう戻らないため、
 * 「BAN 済み」と出して解除の対象に見せない。
 *
 * @param profile - 対象ユーザーのプロフィール。無ければ仮登録
 * @param authUser - 対象の認証ユーザー（Admin API の `User`）
 * @param now - BAN の期限と比べる現在時刻
 */
export function resolveUserStatus(
  profile: Pick<Profile, "bannedAt" | "deletedAt"> | undefined,
  authUser: Pick<User, "banned_until">,
  now: Date,
): UserStatus {
  if (profile?.deletedAt != null) return UserStatus.Deleted;
  if (profile?.bannedAt != null || isAuthBanned(authUser, now)) {
    return UserStatus.Banned;
  }
  if (!profile) return UserStatus.Provisional;
  return UserStatus.Active;
}
