import { jstDayKey } from "@mahjong-scoring/features/jst";

export interface DailyCount {
  /** YYYY-MM-DD（JST） */
  readonly date: string;
  readonly count: number;
}

/**
 * 取得済みアイテム列を JST 日単位でバケットする純粋関数。
 *
 * 日付抽出関数を受け取り、[startDate, endDate] の全日（0 件の日も含む）を
 * 網羅した `DailyCount[]` と合計を返す。データ取得は呼び出し側が担う。
 */
export function aggregateByDay<T>(
  items: readonly T[],
  getDate: (item: T) => string | Date,
  range: { readonly startDate: string; readonly endDate: string },
): { daily: DailyCount[]; total: number } {
  const countsByDate = new Map<string, number>();

  for (const item of items) {
    const raw = getDate(item);
    const createdAt = raw instanceof Date ? raw : new Date(raw);
    const dateKey = jstDayKey(createdAt);
    // YYYY-MM-DD は文字列の大小が日付の前後と一致する
    if (dateKey >= range.startDate && dateKey <= range.endDate) {
      countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
    }
  }

  const daily = fillDateRange(range.startDate, range.endDate, countsByDate);
  const total = daily.reduce((sum, d) => sum + d.count, 0);

  return { daily, total };
}

/**
 * 日付範囲を 0 件の日も含めて埋める。
 */
export function fillDateRange(
  startDate: string,
  endDate: string,
  countsByDate: Map<string, number>,
): DailyCount[] {
  const result: DailyCount[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    const dateKey = current.toISOString().slice(0, 10);
    result.push({ date: dateKey, count: countsByDate.get(dateKey) ?? 0 });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}
