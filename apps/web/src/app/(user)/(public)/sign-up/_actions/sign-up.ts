"use server";

import { SITE_URL } from "@/config";
import type { ActionResult } from "@/lib/action-types";
import { IP_RATE_LIMITS, enforceIpRateLimit } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";
import { getPasswordValidationError } from "@/lib/validations/password";

export type SignUpResult = ActionResult;

/**
 * メールアドレス/パスワードによるサインアップ Server Action。
 * メールサインアップ
 */
export async function signUp(
  email: string,
  password: string,
): Promise<SignUpResult> {
  const rateLimited = await enforceIpRateLimit("signUp", IP_RATE_LIMITS.signUp);
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
