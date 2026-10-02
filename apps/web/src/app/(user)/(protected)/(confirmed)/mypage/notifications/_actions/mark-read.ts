"use server";

import { z } from "zod";

import type { ActionResult } from "@/lib/action-types";
import {
  guardUserAction,
  type UserActionGuardErrorCode,
} from "@/lib/action-guard";
import { logExternalError } from "@/lib/log-error";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/queries";

/** 既読化の失敗理由 */
export type MarkReadError =
  UserActionGuardErrorCode | "invalidId" | "markFailed";

/**
 * 通知 1 件を既読にする Server Action
 * 通知既読化
 *
 * 通知の行を押したときに呼ぶ。本人の行しか更新しない（クエリ側が
 * ユーザー ID で絞る）ので、他人の id を渡されても何も起きない。
 *
 * @param notificationId - 通知の id。クライアントの入力なので UUID に絞る
 */
export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult<MarkReadError>> {
  const id = z.string().uuid().safeParse(notificationId);
  if (!id.success) return { error: "invalidId" };

  const guard = await guardUserAction("markNotificationsRead");
  if ("error" in guard) return guard;

  try {
    await markNotificationRead(guard.user.id, id.data);
  } catch (error) {
    logExternalError(
      "markNotificationRead",
      "failed to mark notification read",
      error,
    );
    return { error: "markFailed" };
  }
  return { success: true };
}

/**
 * 未読をすべて既読にする Server Action
 * 全通知既読化
 */
export async function markAllNotificationsReadAction(): Promise<
  ActionResult<MarkReadError>
> {
  const guard = await guardUserAction("markNotificationsRead");
  if ("error" in guard) return guard;

  try {
    await markAllNotificationsRead(guard.user.id);
  } catch (error) {
    logExternalError(
      "markAllNotificationsRead",
      "failed to mark all notifications read",
      error,
    );
    return { error: "markFailed" };
  }
  return { success: true };
}
