"use server";

import type { ActionResult } from "@/lib/action-types";
import { logActivityEvent } from "@/lib/activity-log";
import { authenticateAndCheckBan } from "@/lib/auth";
import type { AuthGateErrorCode } from "@/lib/auth";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
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
  RateLimitErrorCode | AuthGateErrorCode | DeleteAccountError;

export async function deleteOwnAccount(): Promise<
  ActionResult<DeleteOwnAccountError>
> {
  const rateLimited = await enforceIpRateLimit("deleteAccount");
  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await authenticateAndCheckBan();
  if ("error" in authResult) {
    return authResult;
  }
  const { user } = authResult;

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
