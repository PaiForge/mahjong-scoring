import { NextResponse } from "next/server";

import { logActivityEvent } from "@/lib/activity-log";
import { authorizeApiRequest } from "@/lib/api-auth";
import { IP_RATE_LIMITS } from "@/lib/rate-limit-ip";
import { deleteAccount } from "@/lib/users/delete-account";

/**
 * アカウント退会エンドポイント。
 *
 * 退会処理の本体は `deleteAccount()`（src/lib/users/delete-account.ts）に集約している。
 * ここでは認証・レート制限・アクティビティログのみを担う。
 *
 * アカウント退会API
 */
export async function DELETE() {
  const auth = await authorizeApiRequest(
    "deleteAccount",
    IP_RATE_LIMITS.deleteAccount,
  );
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const result = await deleteAccount(user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  logActivityEvent({
    userId: user.id,
    action: "delete_account",
    targetType: "user",
    targetId: user.id,
  });

  return NextResponse.json({ success: true });
}
