"use server";

import { isApplePrivateRelayEmail } from "@mahjong-scoring/features/account/login-methods";

import { currentLocale } from "@/i18n/current-locale";
import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { logActivityEvent } from "@/lib/activity-log";
import { isAuthEmailRateLimited } from "@/lib/auth-service-failure";
import { logExternalError } from "@/lib/log-error";
import { recoveryRedirectTo } from "@/lib/recovery-redirect";
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
 *
 * 英語のページから送ったときは、メールのリンク（`/auth/callback`）に
 * `locale=<言語>` を付け、パスワードを決める画面を同じ言語で開かせる
 * （`/auth/callback` は言語の接頭辞を持たない共通の入口なので、言語を URL で
 * 運ぶ）。言語は Action を呼んだページの言語（`currentLocale()`）。日本語では
 * 付けない（従来のリンクのまま。無い場合は日本語として扱われる）。
 */
export async function requestPasswordSetup(): Promise<
  ActionResult<RequestPasswordSetupError, { readonly email: string }>
> {
  const guard = await guardUserAction("requestPasswordSetup");
  if ("error" in guard) return guard;
  const { user } = guard;

  if (user.email === undefined) return { error: "noEmail" };
  if (isApplePrivateRelayEmail(user.email)) return { error: "relayAddress" };

  const locale = await currentLocale();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: recoveryRedirectTo(locale),
  });
  if (error) {
    if (isAuthEmailRateLimited(error)) return { error: "rateLimited" };
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
