import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

/**
 * next-intl の型の拡張（web）
 *
 * `Locale` を対応ロケール（`ja` / `en`）に絞る。`getLocale()` /
 * `useLocale()` / `getRequestConfig` の戻り値が素の string ではなくなり、
 * ロケールの分岐（`locale === "en"`）の綴り違いを型で落とせる。
 *
 * `Messages`（辞書の形）は拡張しない。日本語の辞書を形の正典にして拡張すると、
 * キーをテンプレートリテラルや変数で組む呼び出し（``t(`${option}.hint`)``・
 * レジストリの `namespace` を渡す `useTranslations(menu.namespace)` 等）が
 * 全部で 100 か所以上型エラーになる（2026-11 に実測）。辞書の形の検査は
 * `@mahjong-scoring/messages` の `MessagesShape` と `en.test.ts` が持つ。
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: SupportedLocale;
  }
}
