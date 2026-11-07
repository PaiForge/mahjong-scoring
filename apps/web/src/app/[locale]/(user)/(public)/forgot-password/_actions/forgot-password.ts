"use server";

import { SITE_URL } from "@/config";
import { currentLocale } from "@/i18n/current-locale";
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
 *
 * `redirectTo` に送信元のページの言語（`locale`）を付け、`/auth/callback` が
 * 再設定のページをその言語で開けるようにする。言語は Server Action の要求に
 * proxy（next-intl）が載せるロケールのヘッダから取る（`currentLocale()`。
 * `/en/forgot-password` から送れば `en`）。クライアントから言語を引数で受け取らない。
 * なお、今のメールのテンプレートは `redirectTo` ではなく `SiteURL` + `token_hash` の
 * リンクを日英 2 つ持つので、この値が効くのは `ConfirmationURL` を経由する経路だけ。
 */
export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResult> {
  const rateLimited = await enforceIpRateLimit("forgotPassword");
  if (rateLimited) {
    return rateLimited;
  }

  const locale = await currentLocale();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?type=recovery&locale=${locale}`,
  });

  // アカウント列挙を防ぐため、エラーの有無に関わらず常に成功を返す
  return { success: true };
}
