import type { DatePeriod } from "./types";

interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * 指定期間の開始日・終了日を返す
 * 期間範囲取得
 *
 * `now` を引数で受け取る純粋関数。内部で現在時刻を読むと週・月の境界を
 * テストで固定できず、サーバーとクライアントで別々の「今」を見ることになる
 * （マイページのヒートマップも同じ理由で `now` を注入している）。
 *
 * @param period - 対象期間
 * @param now - 「今」として扱う時刻。呼び出し側で1回だけ `new Date()` して渡す
 */
export function getPeriodRange(period: DatePeriod, now: Date): DateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "thisWeek": {
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((day + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    case "lastWeek": {
      const day = today.getDay();
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - ((day + 6) % 7));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);
      return { start: lastMonday, end: lastSunday };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }
}

/**
 * 指定期間の前の期間の開始日・終了日を返す
 * 前期間範囲取得
 *
 * @param period - 対象期間（この1つ前の期間を返す）
 * @param now - 「今」として扱う時刻
 */
export function getPreviousPeriodRange(
  period: DatePeriod,
  now: Date,
): DateRange {
  switch (period) {
    case "thisWeek":
      return getPeriodRange("lastWeek", now);
    case "lastWeek": {
      const lastWeek = getPeriodRange("lastWeek", now);
      const start = new Date(lastWeek.start);
      start.setDate(start.getDate() - 7);
      const end = new Date(lastWeek.end);
      end.setDate(end.getDate() - 7);
      return { start, end };
    }
    case "thisMonth":
      return getPeriodRange("lastMonth", now);
    case "lastMonth": {
      const lastMonth = getPeriodRange("lastMonth", now);
      const start = new Date(
        lastMonth.start.getFullYear(),
        lastMonth.start.getMonth() - 1,
        1,
      );
      const end = new Date(
        lastMonth.start.getFullYear(),
        lastMonth.start.getMonth(),
        0,
      );
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }
}
