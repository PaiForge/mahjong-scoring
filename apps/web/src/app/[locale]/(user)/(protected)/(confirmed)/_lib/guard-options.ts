import type { AuthGuardOptions } from "@/lib/auth";
import { localizedHref } from "@/i18n/public-path";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * 本登録領域のページがガードに渡すオプション
 * ガードの戻り先
 *
 * 英語のページでは、未ログインで開いた人をログインのあとに同じ言語の同じページへ
 * 戻す（`/en/mypage` → `/en/sign-in?redirect=%2Fen%2Fmypage`）。戻り先が無いと
 * ログインの既定の着地（日本語の `/mypage`）へ落ち、言語が切り替わってしまう。
 *
 * 日本語では戻り先を付けない（従来どおり `/sign-in` へ飛ばす）。日本語の
 * リダイレクト先の URL を変えないため。道場のログイン導線と同じ扱い。
 *
 * @param path - ページのロケール非依存のパス（`/mypage/plan`）
 * @param locale - ページの言語（`prepareRouteLocale` の戻り値）
 */
export function confirmedGuardOptions(
  path: string,
  locale: SupportedLocale,
): AuthGuardOptions | undefined {
  return locale === DEFAULT_LOCALE
    ? undefined
    : { returnTo: localizedHref(path, locale) };
}
