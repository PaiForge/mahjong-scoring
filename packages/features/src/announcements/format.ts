/**
 * 一覧の公開日の表示形式（`2026/08/20`）
 * お知らせ一覧日付形式
 *
 * 既定の `month: "short"`（2026年8月20日）は文字幅が日によって変わるため、
 * 日付を縦に並べる一覧では桁揃えできる数字表記を使う。web とモバイルの
 * 一覧が同じ表記を出すためここに置く。
 */
export const ANNOUNCEMENT_LIST_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

/**
 * 詳細の公開日の表示形式（`2026年8月20日`）
 * お知らせ詳細日付形式
 *
 * web とモバイルの詳細が同じ表記を出すためここに置く。
 */
export const ANNOUNCEMENT_DETAIL_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

/**
 * お知らせの公開日をロケールに応じて整形する。
 * 未公開（null）の場合は undefined。
 * 公開日フォーマット
 *
 * @param publishedAt - 公開日時
 * @param locale - ロケール
 * @param options - 表示オプション（既定は year/month:short/day）
 */
export function formatPublishedDate(
  publishedAt: Date | string | null,
  locale: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS,
): string | undefined {
  if (!publishedAt) return undefined;
  return new Date(publishedAt).toLocaleDateString(locale, options);
}
