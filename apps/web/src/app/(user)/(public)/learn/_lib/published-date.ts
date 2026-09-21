/**
 * 章の公開日（ISO 8601 の日付）を日本語表記にする
 * 公開日表記
 *
 * `2026-04-02` → `2026年4月2日`。曜日や時刻は出さない（章の鮮度を示すだけで、
 * 時刻の情報は持っていない）。
 *
 * @param isoDate `CURRICULUM` の `publishedAt`
 */
export function formatPublishedDate(isoDate: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${isoDate}T00:00:00+09:00`));
}
