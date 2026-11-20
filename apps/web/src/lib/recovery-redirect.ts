import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { SITE_URL } from "@/config";

/**
 * パスワード回復メールのリンクの着地先
 * パスワード回復メールのリダイレクト先
 *
 * パスワードを忘れたとき（`forgotPassword`）と、ログイン中にパスワードを設定・
 * 変更するとき（`requestPasswordSetup`）の両方で同じ組み立てを使う。片方だけ
 * 直すことがないよう 1 か所に置く。
 *
 * 既定以外の言語（英語）のときだけ `&locale=<言語>` を付け、`/auth/callback` が
 * 再設定のページをその言語で開けるようにする。日本語は従来の文字列のまま
 * （`locale` 無しはコールバックが日本語として扱う。本番の Supabase の
 * Redirect URLs の許可リストと照合される文字列も変えない）。
 *
 * @param locale - メールを送る操作をしたページの言語
 */
export function recoveryRedirectTo(locale: SupportedLocale): string {
  const localeQuery = locale === DEFAULT_LOCALE ? "" : `&locale=${locale}`;
  return `${SITE_URL}/auth/callback?type=recovery${localeQuery}`;
}
