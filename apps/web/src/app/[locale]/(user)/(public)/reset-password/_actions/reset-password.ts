"use server";

import type { ActionResult } from "@/lib/action-types";
import { logActivityEvent } from "@/lib/activity-log";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";
import { ensureEmailIdentity } from "@/lib/users/login-methods";
import { getPasswordValidationError } from "@mahjong-scoring/features/account/password";
import type { PasswordValidationErrorKey } from "@mahjong-scoring/features/account/password";

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
 *
 * Google / Apple で登録した人が初めてパスワードを決める道でもある
 * （アカウントのページの「パスワードを設定」もここへ来る）。認証サーバーは
 * パスワードを足しても `email` の連携を作らないので、設定の後に補う
 * （無いと Google / Apple の連携を外せない）。
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
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "updateFailed" };
  }

  if (data.user.email !== undefined)
    await ensureEmailIdentity(
      data.user.id,
      data.user.email,
      data.user.identities ?? [],
    );

  logActivityEvent({ userId: data.user.id, action: "change_password" });

  return { success: true };
}
