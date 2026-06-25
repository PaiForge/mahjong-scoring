import { NextResponse } from "next/server";

import { logActivityEvent } from "@/lib/activity-log";
import { getClientIp } from "@/lib/client-ip";
import { IP_RATE_LIMITS, checkIpRateLimitGuard } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";
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
  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    "deleteAccount",
    IP_RATE_LIMITS.deleteAccount,
  );
  if (ipRateLimited) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
