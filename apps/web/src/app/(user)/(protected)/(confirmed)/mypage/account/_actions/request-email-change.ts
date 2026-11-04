"use server";

import { z } from "zod";

import { isApplePrivateRelayEmail } from "@mahjong-scoring/features/account/login-methods";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { logActivityEvent } from "@/lib/activity-log";
import { logExternalError } from "@/lib/log-error";
import { createClient } from "@/lib/supabase/server";

/**
 * メールアドレスの変更を始める操作の失敗理由
 *
 * - `invalidEmail` — アドレスの形が違う
 * - `sameEmail` — 今のアドレスと同じ
 * - `emailUnavailable` — 認証サーバーがそのアドレスを受け付けなかった（別の
 *   アカウントが使っている等。理由は分けて出さない）
 * - `relayAddress` — 今のアドレスが Apple の「メールを非公開」の中継アドレスで、
 *   変更前の確認メールが届かない
 * - `sendFailed` — 確認メールを送れなかった
 */
export type RequestEmailChangeError =
  | UserActionGuardErrorCode
  | "invalidEmail"
  | "sameEmail"
  | "emailUnavailable"
  | "relayAddress"
  | "sendFailed";

const newEmailSchema = z.email().max(254);

/**
 * メールアドレスの変更を始める Server Action
 * メールアドレス変更の開始
 *
 * 認証サーバーが変更前・変更後の両方のアドレスに確認メールを送る
 * （`double_confirm_changes`）。両方のリンクを開くと変更が確定する
 * （`/auth/callback` の `type=email_change`）。ここで変わるものは無い。
 *
 * @param newEmail - 新しいメールアドレス
 */
export async function requestEmailChange(
  newEmail: string,
): Promise<ActionResult<RequestEmailChangeError>> {
  const guard = await guardUserAction("requestEmailChange");
  if ("error" in guard) return guard;
  const { user } = guard;

  const parsed = newEmailSchema.safeParse(newEmail.trim());
  if (!parsed.success) return { error: "invalidEmail" };
  const email = parsed.data.toLowerCase();
  if (email === user.email?.toLowerCase()) return { error: "sameEmail" };
  if (isApplePrivateRelayEmail(user.email)) return { error: "relayAddress" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    if (error.code === "email_exists" || error.code === "email_address_invalid")
      return { error: "emailUnavailable" };
    if (error.status === 429 || error.code === "over_email_send_rate_limit")
      return { error: "rateLimited" };
    logExternalError(
      "requestEmailChange",
      "updateUser({ email }) failed",
      error,
    );
    return { error: "sendFailed" };
  }

  logActivityEvent({ userId: user.id, action: "request_email_change" });
  return { success: true };
}
