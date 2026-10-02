/**
 * 無料枠の日付境界 — JST の 1 日
 * 練習回数日付
 *
 * 「今日の分」はサーバーの TZ ではなく `Asia/Tokyo` で切る。利用者は
 * 日本在住が前提で、深夜 0 時に枠が戻るのが自然。DB の `day` 列（date）と
 * 未ログインの cookie の両方がこの文字列をキーにする。
 *
 * このモジュールは純粋。
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * JST での日付キー（`YYYY-MM-DD`）
 * JST日付キー
 *
 * JST は夏時間が無く UTC+9 固定なので、9 時間ずらした UTC 日付がそのまま
 * JST の日付になる。`Intl` を使わないのは、同じ計算を {@link jstEndOfDay} と
 * 共有するため。
 */
export function jstDayKey(now: Date): string {
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * JST でのその日の終わり（翌日 0:00 JST）
 * JST日終わり
 *
 * 未ログインの cookie の有効期限に使う。期限が来れば cookie 自体が消え、
 * 枠が戻る。
 */
export function jstEndOfDay(now: Date): Date {
  const shifted = now.getTime() + JST_OFFSET_MS;
  const startOfJstDayUtc =
    Math.floor(shifted / DAY_MS) * DAY_MS - JST_OFFSET_MS;
  return new Date(startOfJstDayUtc + DAY_MS);
}
