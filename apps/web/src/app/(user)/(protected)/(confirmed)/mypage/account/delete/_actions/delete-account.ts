"use server";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { logActivityEvent } from "@/lib/activity-log";
import { logExternalError } from "@/lib/log-error";
import {
  requestAccountDeletion,
  type AccountDeletionStatus,
} from "@/lib/users/delete-account";

/** 退会の失敗理由（受付そのものに失敗した。工程の失敗はサーバーが再開する） */
export type DeleteOwnAccountError = UserActionGuardErrorCode | "deleteFailed";

/**
 * アカウント退会 Server Action。
 *
 * 受付と工程の実行は `requestAccountDeletion()`（src/lib/users/delete-account.ts）に
 * 集約している（アプリ向け API と共有）。ここでは認証・レート制限・アクティビティ
 * ログのみを担う。BAN 中でも退会は受け付ける（本人による退会は BAN の対象にしない）。
 *
 * 成功は「受け付けた」で、`status` が `pending` なら工程の一部（Storage・Auth）が
 * まだ終わっていない。その分はサーバーが再開するので、本人がやり直す必要は無い。
 *
 * 退会アクション
 */
export async function deleteOwnAccount(): Promise<
  ActionResult<
    DeleteOwnAccountError,
    { readonly status: AccountDeletionStatus }
  >
> {
  const guard = await guardUserAction("deleteAccount", {
    forAccountDeletion: true,
  });
  if ("error" in guard) {
    return guard;
  }
  const { user } = guard;

  let status: AccountDeletionStatus;
  try {
    status = await requestAccountDeletion(user.id);
  } catch (error) {
    logExternalError("deleteOwnAccount", "failed to accept deletion", error);
    return { error: "deleteFailed" };
  }

  logActivityEvent({
    userId: user.id,
    action: "delete_account",
    targetType: "user",
    targetId: user.id,
  });

  return { success: true, status };
}
