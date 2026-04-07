"use server";

import type { ActionResult } from "@/lib/action-types";
import { logActivityEvent } from "@/lib/activity-log";
import { getClientIp } from "@/lib/client-ip";
import { IP_RATE_LIMITS, checkIpRateLimitGuard } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";

export type SignInResult = ActionResult;

/**
 * メールアドレス/パスワードによるサインイン Server Action。
 * アカウント列挙を防ぐため、認証失敗時は汎用エラーを返す。
 * メールサインイン
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    "signIn",
    IP_RATE_LIMITS.signIn,
  );
  if (ipRateLimited) {
    return ipRateLimited;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "invalidCredentials" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    logActivityEvent({ userId: user.id, action: 'login' });
  }

  return { success: true };
}
