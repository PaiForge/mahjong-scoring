"use server";

import type { ActionResult } from "@/lib/action-types";
import { logCurrentUserEvent } from "@/lib/activity-log";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";

/**
 * サインインの失敗理由
 *
 * アカウント列挙を防ぐため、認証失敗は理由を分けず `invalidCredentials` に畳む。
 */
export type SignInError = RateLimitErrorCode | "invalidCredentials";

export type SignInResult = ActionResult<SignInError>;

/**
 * メールアドレス/パスワードによるサインイン Server Action。
 * アカウント列挙を防ぐため、認証失敗時は汎用エラーを返す。
 * メールサインイン
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const rateLimited = await enforceIpRateLimit("signIn");
  if (rateLimited) {
    return rateLimited;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "invalidCredentials" };
  }

  await logCurrentUserEvent(supabase, "login");

  return { success: true };
}
