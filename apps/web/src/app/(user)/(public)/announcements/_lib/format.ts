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
