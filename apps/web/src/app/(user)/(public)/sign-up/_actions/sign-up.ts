"use server";

import { SITE_URL } from "@/config";
import type { ActionResult } from "@/lib/action-types";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";
import { getPasswordValidationError } from "@/lib/validations/password";
import type { PasswordValidationErrorKey } from "@/lib/validations/password";

/**
 * サインアップの失敗理由
 *
 * パスワード起因の失敗は `password:<キー>` 形式で返し、クライアント側の
 * {@link parsePasswordActionError} が翻訳キーに戻す。
 */
export type SignUpError =
  | RateLimitErrorCode
  | `password:${PasswordValidationErrorKey}`
  | "signUpFailed";

export type SignUpResult = ActionResult<SignUpError>;

/**
 * メールアドレス/パスワードによるサインアップ Server Action。
 * メールサインアップ
 */
export async function signUp(
  email: string,
  password: string,
): Promise<SignUpResult> {
  const rateLimited = await enforceIpRateLimit("signUp");
  if (rateLimited) {
    return rateLimited;
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return { error: `password:${passwordError}` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { error: "password:weak" };
    }
    return { error: "signUpFailed" };
  }

  return { success: true };
}
