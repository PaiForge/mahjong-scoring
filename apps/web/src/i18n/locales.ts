/**
 * アプリのロケール定義
 *
 * @description
 * 現状 UI のロケールは日本語固定だが、将来の多言語対応に備えて
 * 既定ロケールと対応ロケールを一元管理する。お知らせ等のコンテンツは
 * slug + locale で variant を持てるため、ここで定義した SUPPORTED_LOCALES が
 * 管理画面で作成可能なロケールの一覧になる。
 */

/** 既定ロケール（フォールバック先・UI 固定ロケール） */
export const DEFAULT_LOCALE = "ja";

/** 対応ロケール（コンテンツの variant として作成可能なロケール） */
export const SUPPORTED_LOCALES = ["ja", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * ロケール優先度に従って best な variant を選ぶ。
 *
 * 優先順位: 要求ロケール → DEFAULT_LOCALE → 配列の先頭。
 * `items` は空でない前提（呼び出し側で保証する）。
 */
export function pickByLocale<T extends { locale: string }>(items: T[], locale: string): T {
  return (
    items.find((item) => item.locale === locale) ??
    items.find((item) => item.locale === DEFAULT_LOCALE) ??
    items[0]
  );
}
