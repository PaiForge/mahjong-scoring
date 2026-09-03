"use server";

import type { ActionResult } from "@/lib/action-types";
import { logCurrentUserEvent } from "@/lib/activity-log";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";
import { getPasswordValidationError } from "@/lib/validations/password";
import type { PasswordValidationErrorKey } from "@/lib/validations/password";

/** パスワード再設定の失敗理由 */
export type ResetPasswordError =
  | RateLimitErrorCode
  | `password:${PasswordValidationErrorKey}`
  | "updateFailed";

export type ResetPasswordResult = ActionResult<ResetPasswordError>;

/**
 * パスワード再設定 Server Action。
 * レートリミット付きでサーバーサイドから Supabase の updateUser を呼び出す。
 * パスワード再設定
 */
export async function resetPassword(
  password: string,
): Promise<ResetPasswordResult> {
  const rateLimited = await enforceIpRateLimit("resetPassword");
  if (rateLimited) {
    return rateLimited;
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return { error: `password:${passwordError}` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "updateFailed" };
  }

  await logCurrentUserEvent(supabase, "change_password");

  return { success: true };
}
