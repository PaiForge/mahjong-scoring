/**
 * 無料枠の日付境界 — JST の 1 日
 * 練習回数日付
 *
 * 「今日の分」はサーバーの TZ ではなく `Asia/Tokyo` で切る（`lib/jst.ts`）。
 * DB の `day` 列（date）と未ログインの cookie の両方が `jstDayKey` の文字列を
 * キーにする。
 *
 * このモジュールは純粋。
 */

import { JST_OFFSET_MS } from "../jst";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * JST でのその日の終わり（翌日 0:00 JST）
 * JST日終わり
 *
 * 未ログインの cookie の有効期限に使う。期限が来れば cookie 自体が消え、
 * 枠が戻る。`jstDayKey` と同じ 9 時間のずらしで日を切る。
 */
export function jstEndOfDay(now: Date): Date {
  const shifted = now.getTime() + JST_OFFSET_MS;
  const startOfJstDayUtc =
    Math.floor(shifted / DAY_MS) * DAY_MS - JST_OFFSET_MS;
  return new Date(startOfJstDayUtc + DAY_MS);
}
