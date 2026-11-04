"use server";

import { isApplePrivateRelayEmail } from "@mahjong-scoring/features/account/login-methods";

import { SITE_URL } from "@/config";
import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { logActivityEvent } from "@/lib/activity-log";
import { logExternalError } from "@/lib/log-error";
import { createClient } from "@/lib/supabase/server";

/**
 * パスワード設定のメールを送る操作の失敗理由
 *
 * - `relayAddress` — アドレスが Apple の「メールを非公開」の中継アドレスで届かない
 * - `noEmail` — アカウントにメールアドレスが無い
 * - `sendFailed` — 認証サーバーが送れなかった
 */
export type RequestPasswordSetupError =
  UserActionGuardErrorCode | "relayAddress" | "noEmail" | "sendFailed";

/**
 * パスワードの設定・変更のメールをログイン中のアドレスへ送る Server Action
 * パスワード設定メールの送信
 *
 * 画面でパスワードを直接受け取らず、パスワード再設定と同じ道（メールの
 * リンク → `/reset-password`）を使う。Secure password change は 24 時間より
 * 古いセッションに再認証を求めるが、再設定のリンクは新しいセッションを
 * 出すので、再認証の画面を持たずに同じ強さを保てる。Google / Apple だけで
 * 登録した人もこれでパスワードを足せる。
 */
export async function requestPasswordSetup(): Promise<
  ActionResult<RequestPasswordSetupError, { readonly email: string }>
> {
  const guard = await guardUserAction("requestPasswordSetup");
  if ("error" in guard) return guard;
  const { user } = guard;

  if (user.email === undefined) return { error: "noEmail" };
  if (isApplePrivateRelayEmail(user.email)) return { error: "relayAddress" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${SITE_URL}/auth/callback?type=recovery`,
  });
  if (error) {
    if (error.status === 429 || error.code === "over_email_send_rate_limit")
      return { error: "rateLimited" };
    logExternalError(
      "requestPasswordSetup",
      "resetPasswordForEmail failed",
      error,
    );
    return { error: "sendFailed" };
  }

  logActivityEvent({ userId: user.id, action: "request_password_setup" });
  return { success: true, email: user.email };
}
