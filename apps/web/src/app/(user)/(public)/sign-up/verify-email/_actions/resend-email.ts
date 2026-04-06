"use server";

import type { ActionResult } from "@/lib/action-types";
import { getClientIp } from "@/lib/client-ip";
import { IP_RATE_LIMITS, checkIpRateLimitGuard } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";

export type ResendEmailResult = ActionResult;

/**
 * 確認メール再送 Server Action。
 * メール再送アクション
 */
export async function resendEmail(
  email: string,
): Promise<ResendEmailResult> {
  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    "resendEmail",
    IP_RATE_LIMITS.resendEmail,
  );
  if (ipRateLimited) {
    return ipRateLimited;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    return { error: "resendFailed" };
  }

  return { success: true };
}
