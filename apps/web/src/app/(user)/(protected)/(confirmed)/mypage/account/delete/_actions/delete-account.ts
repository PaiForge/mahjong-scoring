"use server";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { logActivityEvent } from "@/lib/activity-log";
import { deleteAccount } from "@/lib/users/delete-account";
import type { DeleteAccountError } from "@/lib/users/delete-account";

/**
 * アカウント退会 Server Action。
 *
 * 退会処理の本体は `deleteAccount()`（src/lib/users/delete-account.ts）に集約している。
 * ここでは認証・レート制限・アクティビティログのみを担う。
 *
 * 退会アクション
 */
/** 退会の失敗理由 */
export type DeleteOwnAccountError =
  UserActionGuardErrorCode | DeleteAccountError;

export async function deleteOwnAccount(): Promise<
  ActionResult<DeleteOwnAccountError>
> {
  const guard = await guardUserAction("deleteAccount");
  if ("error" in guard) {
    return guard;
  }
  const { user } = guard;

  const result = await deleteAccount(user.id);
  if ("error" in result) {
    return result;
  }

  logActivityEvent({
    userId: user.id,
    action: "delete_account",
    targetType: "user",
    targetId: user.id,
  });

  return { success: true };
}
