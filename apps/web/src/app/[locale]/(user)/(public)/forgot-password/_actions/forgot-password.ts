"use server";

import { SITE_URL } from "@/config";
import type { ActionResult } from "@/lib/action-types";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";

/**
 * パスワードリセットメール送信の失敗理由
 *
 * アカウント列挙を防ぐため送信結果は成功に畳んでおり、レートリミット以外の
 * 失敗を返さない。
 */
export type ForgotPasswordError = RateLimitErrorCode;

export type ForgotPasswordResult = ActionResult<ForgotPasswordError>;

/**
 * パスワードリセットメール送信 Server Action。
 * アカウント列挙を防ぐため、常に成功を返す。
 * パスワードリセットメール送信
 */
export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResult> {
  const rateLimited = await enforceIpRateLimit("forgotPassword");
  if (rateLimited) {
    return rateLimited;
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?type=recovery`,
  });

  // アカウント列挙を防ぐため、エラーの有無に関わらず常に成功を返す
  return { success: true };
}
