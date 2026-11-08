/**
 * アプリの言語の解決
 *
 * @description
 * アプリ（Expo）の表示言語は、起動時に 1 回、端末のアプリ優先言語の並び
 * （iOS の「設定 > アプリ > 言語」を含む OS の優先順）から決める。この関数は
 * その並びから対応言語を 1 つ選ぶだけの純粋な関数で、端末から並びを読むのは
 * アプリの `lib/app-locale.ts`。
 *
 * - アプリ内に言語切替の設定は作らない。対応言語を `CFBundleLocalizations` に
 *   2 つ以上載せると iOS が「アプリごとの言語」を出すので、切り替えは OS に任せる。
 *   アプリ内に設定を置くと、ゲストにも設定画面を開かせることになる
 * - 起動中に端末の言語の変化へ追従しない（`useLocales()` で動的に読む案は採らない）。
 *   iOS はアプリの言語を変えるとアプリを再起動するので追従が要らず、Android だけの
 *   ために Provider を動的にする理由が無い。辞書は同梱で同期に選べるので、
 *   日本語で描いてから切り替えるちらつきも出ない
 */

import type { SupportedLocale } from "./locales";

/**
 * 言語タグ（BCP 47）が指定の言語か。`ja` そのものか `ja-` で始まるもの（大文字小文字は区別しない）
 */
function hasLanguage(languageTag: string, language: SupportedLocale): boolean {
  const tag = languageTag.toLowerCase();
  return tag === language || tag.startsWith(`${language}-`);
}

/**
 * 端末の言語タグ（優先順）から対応言語を 1 つ選ぶ
 *
 * 先頭から順に見て、最初に対応言語（`ja-*` → `ja`、`en-*` → `en`）に当たったものを返す。
 * どれにも当たらなければ `en` — 日本語でも英語でもない端末の人が読める見込みが高いのは
 * 英語で、日本語の UI に落とすと読めない人を作る。
 *
 * 渡すのは言語コード（`ja`）ではなく言語タグ（`ja-JP`）。タグの先頭の言語の部分だけで
 * 判定し、地域（`zh-Hant-JP` の `JP`）は見ない — 地域が日本なだけの別の言語を
 * 日本語と誤認しない。
 *
 * @param languageTags - 端末の優先順の言語タグ（`expo-localization` の `getLocales()` の `languageTag`）
 * @returns アプリの表示言語
 */
export function resolveAppLocale(
  languageTags: readonly string[],
): SupportedLocale {
  for (const tag of languageTags) {
    if (hasLanguage(tag, "ja")) return "ja";
    if (hasLanguage(tag, "en")) return "en";
  }
  return "en";
}
