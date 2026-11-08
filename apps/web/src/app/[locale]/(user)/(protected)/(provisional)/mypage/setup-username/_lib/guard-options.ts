import { localizedHref } from "@/i18n/public-path";
import type { AuthGuardOptions } from "@/lib/auth";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/** ユーザー名の設定のページ（ロケール非依存のパス） */
export const SETUP_USERNAME_PATH = "/mypage/setup-username";

/**
 * ユーザー名の設定のページのガードに渡す指定
 * ユーザー名設定ガード指定
 *
 * 既定以外の言語（英語）では、未ログインのときログイン後にこのページ（同じ言語）へ
 * 戻すよう `returnTo` を渡す（ガードはパスを知らないので、ページが渡す）。
 *
 * @design 日本語では戻り先を付けない
 *
 * 日本語の未ログインの飛ばし先は従来どおり `/sign-in`（`?redirect=` 無し）のまま
 * にする。日本語の挙動を変えないため。ログイン後はマイページへ着き、プロフィールが
 * 無ければマイページのガードがここへ送り直すので、日本語でも行き着く先は同じ。
 *
 * @param locale - ページの言語
 */
export function setupUsernameGuardOptions(
  locale: SupportedLocale,
): AuthGuardOptions | undefined {
  return locale === DEFAULT_LOCALE
    ? undefined
    : { returnTo: localizedHref(SETUP_USERNAME_PATH, locale) };
}
