"use server";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { getOptionalUser } from "@/lib/auth";
import {
  blockUser,
  listBlockedUsers,
  unblockUser,
  type BlockedUser,
} from "@/lib/blocks/blocks";
import { logExternalError } from "@/lib/log-error";

/** ブロック・解除の失敗理由 */
export type BlockActionError =
  UserActionGuardErrorCode | "notFound" | "self" | "failed";

/**
 * 相手をブロックする Server Action
 * ブロック
 *
 * 公開プロフィールのボタンから呼ぶ。画面の作り直しは呼び出し側
 * （`router.refresh()`）が行う — プロフィールもランキングも動的に描くので、
 * キャッシュを捨てる必要は無い。
 */
export async function blockUserAction(
  username: string,
): Promise<ActionResult<BlockActionError>> {
  const guard = await guardUserAction("updateBlocks");
  if ("error" in guard) return guard;
  try {
    const result = await blockUser(guard.user.id, username);
    if (result === "accountClosing") return { error: "unauthorized" };
    if (result !== "done") return { error: result };
  } catch (error) {
    logExternalError("blockUserAction", "failed to block", error);
    return { error: "failed" };
  }
  return { success: true };
}

/**
 * ブロックを解除する Server Action
 * ブロック解除
 *
 * 公開プロフィールと設定の「ブロックしたユーザー」から呼ぶ。
 */
export async function unblockUserAction(
  username: string,
): Promise<ActionResult<BlockActionError>> {
  const guard = await guardUserAction("updateBlocks");
  if ("error" in guard) return guard;
  try {
    const result = await unblockUser(guard.user.id, username);
    if (result !== "done") return { error: result };
  } catch (error) {
    logExternalError("unblockUserAction", "failed to unblock", error);
    return { error: "failed" };
  }
  return { success: true };
}

/** 設定の一覧に渡す 1 行（日時は直列化できる文字列にする） */
export type BlockedUserView = Omit<BlockedUser, "blockedAt">;

/**
 * ブロックした人の一覧を返す Server Action
 * ブロック一覧取得
 *
 * 設定ページは静的に描くので、一覧は描画後にここから取る
 * （ランキング非表示の設定と同じ割り切り）。未ログインなら空。失敗は
 * undefined で返し、画面が「読み込めなかった」と出す。
 */
export async function getBlockedUsersAction(): Promise<
  readonly BlockedUserView[] | undefined
> {
  const user = await getOptionalUser();
  if (!user) return [];
  try {
    const rows = await listBlockedUsers(user.id);
    return rows.map(({ username, displayName, avatarUrl }) => ({
      username,
      displayName,
      avatarUrl,
    }));
  } catch (error) {
    logExternalError("getBlockedUsersAction", "failed to list blocks", error);
    return undefined;
  }
}
