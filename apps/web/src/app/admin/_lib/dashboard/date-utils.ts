import {
  jstCalendarDate,
  jstDayKey,
  jstStartOfDay,
} from "@mahjong-scoring/features/jst";

/**
 * `now` から `days` 日前の日付（当日を含む範囲の開始日）を YYYY-MM-DD（JST）で返す。
 * 例: `daysAgo(28, now)` は当日を含む直近 28 日間の開始日。
 *
 * 現在時刻を内部で読まない純粋関数。読んでしまうと日付境界の振る舞いを
 * テストで固定できず、同じ画面の中で「今日」が複数回別々に解決される。
 *
 * @param days - 当日を含む日数
 * @param now - 「今」として扱う時刻（この Date は変更しない）
 */
export function daysAgo(days: number, now: Date): string {
  const { year, month, day } = jstCalendarDate(now);
  return jstDayKey(jstStartOfDay(year, month, day - days + 1));
}

/**
 * `now` の日付を YYYY-MM-DD（JST）で返す。
 *
 * @param now - 「今」として扱う時刻
 */
export function today(now: Date): string {
  return jstDayKey(now);
}
