/**
 * 今日から `days` 日前の日付（当日を含む範囲の開始日）を YYYY-MM-DD（UTC）で返す。
 * 例: `daysAgo(28)` は当日を含む直近 28 日間の開始日。
 */
export function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * 今日の日付を YYYY-MM-DD（UTC）で返す。
 */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
