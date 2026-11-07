import { localizedHref } from "@/i18n/public-path";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/** Google の OAuth の戻り先と、戻って着く先（トーストの預かりに使う） */
export interface OAuthCallbackTarget {
  /** `signInWithOAuth` の `redirectTo` に渡す `/auth/callback` の絶対 URL */
  readonly redirectTo: string;
  /** ログイン済み（プロフィールあり）で着く先。トーストの着地の判定に使う */
  readonly landing: string;
}

/**
 * Google の OAuth の戻り先（`/auth/callback`）を組む
 * OAuth戻り先URL
 *
 * `/auth/callback` は `app/[locale]` の外にあり（`/en/auth/callback` は無い）、
 * 言語を URL から知れない。そこで既定以外の言語（英語）のときだけ `locale=en` と
 * 言語付きの `next`（未指定ならその言語のマイページ）を付ける。コールバックは
 * `locale` を見て、プロフィールが無いとき（`next` を捨てて setup-username へ送る
 * 経路）や失敗の着地もその言語にする。
 *
 * @design 日本語では戻り先の文字列を従来と同じにする
 *
 * 日本語は `locale` を付けず、`next` も戻り先の指定（`redirectTo`）があるときだけ
 * 付ける（コールバックは `locale` が無ければ日本語として扱う）。日本語の出力を
 * 変えないことに加え、本番の Supabase の Redirect URLs の許可リストと照合される
 * 文字列を変えないため。
 *
 * @param origin - ページの origin（`window.location.origin`）
 * @param locale - ページの言語
 * @param redirectTo - ログイン成功時の遷移先（公開 URL の形。検証済み）。未指定可
 */
export function buildOAuthCallbackTarget(
  origin: string,
  locale: SupportedLocale,
  redirectTo: string | undefined,
): OAuthCallbackTarget {
  const callbackUrl = new URL("/auth/callback", origin);
  if (locale === DEFAULT_LOCALE) {
    if (redirectTo) callbackUrl.searchParams.set("next", redirectTo);
    return {
      redirectTo: callbackUrl.toString(),
      landing: redirectTo ?? "/mypage",
    };
  }
  const next = redirectTo ?? localizedHref("/mypage", locale);
  callbackUrl.searchParams.set("locale", locale);
  callbackUrl.searchParams.set("next", next);
  return { redirectTo: callbackUrl.toString(), landing: next };
}
