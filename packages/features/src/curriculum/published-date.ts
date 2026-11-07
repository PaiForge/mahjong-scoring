import { DEFAULT_LOCALE, type SupportedLocale } from "../i18n/locales";
import { JST_TIME_ZONE, formatJstDayKeyLong, jstDayStartIso } from "../jst";

/**
 * 英語の公開日の書式（`April 2, 2026`）
 *
 * `jst.ts` の書式（`formatJstDayKeyLong`）は日本語専用のまま置き、英語の書式は
 * 章の公開日の表記にしか使わないのでここに持つ。暦は日本語と同じく JST で切る
 * （端末のタイムゾーンで日付がずれないように）。
 */
const EN_PUBLISHED_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: JST_TIME_ZONE,
});

/**
 * 章の公開日（ISO 8601 の日付）を、ページの言語の表記にする
 * 公開日表記
 *
 * - `ja`（既定）— `2026-04-02` → `2026年4月2日`
 * - `en` — `2026-04-02` → `April 2, 2026`
 *
 * 曜日や時刻は出さない（章の鮮度を示すだけで、時刻の情報は持っていない）。
 * web とモバイルのレッスンが同じ表記を出すためここに置く。モバイルは
 * 日本語だけなので言語を渡さない（既定の日本語になる）。
 *
 * 渡す日付はその言語のページを公開した日にする（英語なら翻訳の公開日
 * `translatedAt.en`。日本語の章の公開日を英語の書式で出さない）。
 *
 * @param isoDate その言語のページの公開日（日本語は `CURRICULUM` の `publishedAt`）
 * @param locale ページの言語（省略時は日本語）
 */
export function formatPublishedDate(
  isoDate: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  if (locale === DEFAULT_LOCALE) return formatJstDayKeyLong(isoDate);
  return EN_PUBLISHED_DATE_FORMAT.format(new Date(jstDayStartIso(isoDate)));
}
