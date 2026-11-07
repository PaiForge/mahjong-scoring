"use server";

import { SITE_URL } from "@/config";
import { currentLocale } from "@/i18n/current-locale";
import type { ActionResult } from "@/lib/action-types";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";

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
 *
 * 既定以外の言語（英語）のページから送ったときだけ、`redirectTo` に `&locale=en` を
 * 付け、`/auth/callback` が再設定のページをその言語で開けるようにする。日本語は
 * 従来の文字列のまま（`locale` 無しはコールバックが日本語として扱う。本番の
 * Supabase の Redirect URLs の許可リストと照合される文字列も変えない）。
 * 言語は Server Action の要求に proxy（next-intl）が載せるロケールのヘッダから取る
 * （`currentLocale()`。`/en/forgot-password` から送れば `en`）。クライアントから
 * 言語を引数で受け取らない。なお、今のメールのテンプレートは `redirectTo` ではなく
 * `SiteURL` + `token_hash` のリンクを日英 2 つ持つので、この値が効くのは
 * `ConfirmationURL` を経由する経路だけ。
 */
export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResult> {
  const rateLimited = await enforceIpRateLimit("forgotPassword");
  if (rateLimited) {
    return rateLimited;
  }

  const locale = await currentLocale();
  const localeQuery = locale === DEFAULT_LOCALE ? "" : `&locale=${locale}`;
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?type=recovery${localeQuery}`,
  });

  // アカウント列挙を防ぐため、エラーの有無に関わらず常に成功を返す
  return { success: true };
}
