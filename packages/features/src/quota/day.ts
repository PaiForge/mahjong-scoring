/**
 * 無料枠の日付境界 — JST の 1 日
 * 練習回数日付
 *
 * 「今日の分」はサーバーの TZ ではなく `Asia/Tokyo` で切る（`jst.ts`）。
 * DB の `day` 列（date）と未ログインの cookie の両方が `jstDayKey` の文字列を
 * キーにする。
 *
 * このモジュールは純粋。
 */

import { jstCalendarDate, jstStartOfDay } from "../jst";

/**
 * JST でのその日の終わり（翌日 0:00 JST）
 * JST日終わり
 *
 * 未ログインの cookie の有効期限に使う。期限が来れば cookie 自体が消え、
 * 枠が戻る。`jstDayKey` と同じ 9 時間のずらしで日を切る（`jstCalendarDate`）。
 */
export function jstEndOfDay(now: Date): Date {
  const { year, month, day } = jstCalendarDate(now);
  return jstStartOfDay(year, month, day + 1);
}
