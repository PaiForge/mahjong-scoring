"use server";

import type { ActionResult } from "@/lib/action-types";
import { IP_RATE_LIMITS, enforceIpRateLimit } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";

export type ResendEmailResult = ActionResult;

/**
 * 確認メール再送 Server Action。
 * メール再送アクション
 */
export async function resendEmail(email: string): Promise<ResendEmailResult> {
  const ipRateLimited = await enforceIpRateLimit(
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
    // GoTrue の送信頻度制限（max_frequency / 1時間あたり送信上限）に当たった場合は
    // 「失敗」ではなく「しばらく待って」と案内する。
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return { error: "rateLimited" };
    }
    return { error: "resendFailed" };
  }

  return { success: true };
}
