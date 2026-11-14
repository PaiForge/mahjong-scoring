import { getLocales } from "expo-localization";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { messagesForLocale } from "@mahjong-scoring/features/i18n/messages-for-locale";
import { resolveAppLocale } from "@mahjong-scoring/features/i18n/resolve-app-locale";
import type { Messages } from "use-intl";

/**
 * アプリの表示言語（起動時に 1 回決まる）
 *
 * 端末のアプリ優先言語の並び（`getLocales()`。iOS の「設定 > アプリ > 言語」で
 * アプリだけ変えた言語も先頭に来る）の言語タグを `resolveAppLocale()` に渡して決める。
 * 日本語でも英語でもない端末は英語。
 *
 * - モジュールの評価時に 1 回だけ読み、起動中の言語の変化に追従しない。iOS は
 *   アプリの言語を変えるとアプリを再起動する。Android だけのために Provider を
 *   動的にする理由は無い（`useLocales()` で追従する案は採らない）
 * - アプリ内に言語切替の設定は作らない。`app.json` の `expo-localization` の
 *   `supportedLocales` で 2 言語を載せると、iOS が OS 側に「アプリごとの言語」を出す。
 *   アプリ内に設定を置くと、ゲストにも設定画面を開かせることになる。iOS ではマイページの
 *   言語の行（`LanguageSettingsRow`）が、設定アプリのこのアプリの画面を開く
 * - 言語コード（`languageCode`）ではなく言語タグ（`languageTag`）を渡す。判定は
 *   タグの言語の部分だけで行い、地域が日本なだけの別の言語を日本語と誤認しない
 *
 * 辞書の Provider（`AppIntlProvider`）と、Provider の外で動く `createTranslator`
 * （購入の同期のトースト）がこの値を読む。画面からは `useAppLocale()` で読む。
 */
export const APP_LOCALE: SupportedLocale = resolveAppLocale(
  getLocales().map((locale) => locale.languageTag),
);

/**
 * アプリの表示言語の辞書
 *
 * {@link APP_LOCALE} の辞書（`messagesForLocale()`）。辞書は同梱で同期に選べるので、
 * 起動直後に日本語で描いてから英語へ切り替えるちらつきは出ない。
 */
export const APP_MESSAGES: Messages = messagesForLocale(APP_LOCALE);
