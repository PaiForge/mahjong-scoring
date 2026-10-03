import { jstCalendarDate, jstStartOfDay } from "@mahjong-scoring/features/jst";

import type { DatePeriod } from "./types";

/**
 * 期間の範囲（`start` 以上 `end` 未満）
 * 期間範囲
 *
 * `end` は含まない。「次の月曜 0:00」「翌月 1 日 0:00」をそのまま置き、
 * DB の `createdAt < end` と整合させる（23:59:59.999 にすると最後の 1 ms が
 * `<` で落ちる）。
 */
interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * 期間の種類と「今」からのずれ。負は過去
 * 期間定義
 */
interface PeriodSpec {
  readonly unit: "week" | "month";
  readonly offset: number;
}

const PERIOD_SPECS: Record<DatePeriod, PeriodSpec> = {
  thisWeek: { unit: "week", offset: 0 },
  lastWeek: { unit: "week", offset: -1 },
  thisMonth: { unit: "month", offset: 0 },
  lastMonth: { unit: "month", offset: -1 },
};

/**
 * `now` を含む週（月曜始まり）から `offset` 週ずらした範囲
 * 週範囲
 */
function weekRange(now: Date, offset: number): DateRange {
  const today = jstCalendarDate(now);
  const daysSinceMonday = (today.weekday + 6) % 7;
  const monday = today.day - daysSinceMonday + offset * 7;
  return {
    start: jstStartOfDay(today.year, today.month, monday),
    end: jstStartOfDay(today.year, today.month, monday + 7),
  };
}

/**
 * `now` を含む月から `offset` ヶ月ずらした範囲
 * 月範囲
 */
function monthRange(now: Date, offset: number): DateRange {
  const today = jstCalendarDate(now);
  return {
    start: jstStartOfDay(today.year, today.month + offset, 1),
    end: jstStartOfDay(today.year, today.month + offset + 1, 1),
  };
}

function rangeOf(period: DatePeriod, now: Date, shift: number): DateRange {
  const { unit, offset } = PERIOD_SPECS[period];
  return unit === "week"
    ? weekRange(now, offset + shift)
    : monthRange(now, offset + shift);
}

/**
 * 指定期間の開始・終了を返す
 * 期間範囲取得
 *
 * 週・月の境界は実行環境の TZ ではなく JST で切る（`lib/jst.ts`）。
 * サーバー（Vercel = UTC）とクライアント（ブラウザ = JST）の両方がこの関数を
 * 呼ぶため、ローカル時刻で切ると JST の 0〜9 時に「今週」「今月」が
 * 別の範囲になる。
 *
 * `now` を引数で受け取る純粋関数。内部で現在時刻を読むと週・月の境界を
 * テストで固定できず、サーバーとクライアントで別々の「今」を見ることになる
 * （マイページのヒートマップも同じ理由で `now` を注入している）。
 *
 * @param period - 対象期間
 * @param now - 「今」として扱う時刻。呼び出し側で1回だけ `new Date()` して渡す
 */
export function getPeriodRange(period: DatePeriod, now: Date): DateRange {
  return rangeOf(period, now, 0);
}

/**
 * 指定期間の 1 つ前の期間の開始・終了を返す
 * 前期間範囲取得
 *
 * @param period - 対象期間（この1つ前の期間を返す）
 * @param now - 「今」として扱う時刻
 */
export function getPreviousPeriodRange(
  period: DatePeriod,
  now: Date,
): DateRange {
  return rangeOf(period, now, -1);
}
