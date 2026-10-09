import { jstCalendarDate, jstStartOfDay } from "../jst";

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
 * 週・月の境界は実行環境の TZ ではなく JST で切る（`../jst`）。
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

/**
 * 期間に応じた比較ラベルの辞書キー（`mypage.challenges.<キー>`）を返す
 * 比較ラベルキー取得
 *
 * 翻訳関数を受け取らずキーを返す — web（next-intl）とアプリ（use-intl）の
 * どちらの翻訳関数でも引けるようにするため。
 */
export function getComparisonLabelKey(
  period: DatePeriod,
): "vsLastWeek" | "vs2WeeksAgo" | "vsLastMonth" | "vs2MonthsAgo" {
  switch (period) {
    case "thisWeek":
      return "vsLastWeek";
    case "lastWeek":
      return "vs2WeeksAgo";
    case "thisMonth":
      return "vsLastMonth";
    case "lastMonth":
      return "vs2MonthsAgo";
  }
}

/**
 * 前の期間のラベルキーを返す
 * 前期間ラベルキー
 */
export function getPreviousPeriodLabel(
  period: DatePeriod,
): "lastWeek" | "twoWeeksAgo" | "lastMonth" | "twoMonthsAgo" {
  switch (period) {
    case "thisWeek":
      return "lastWeek";
    case "lastWeek":
      return "twoWeeksAgo";
    case "thisMonth":
      return "lastMonth";
    case "lastMonth":
      return "twoMonthsAgo";
  }
}

/**
 * 凡例クリックで遷移可能な前の期間を返す。不可なら undefined。
 * 遷移可能な前期間
 *
 * 同ファイルの {@link getComparisonLabel} などは戻り値が `string` のため、
 * 分岐が漏れると「undefined を返しうる」ことになって型検査で落ちる。
 * この関数は戻り値に `undefined` を含むので同じ守りが効かない
 * （漏れたケースは黙って「遷移不可」に落ちる）。default で `never` を
 * 受け止め、DatePeriod にケースが増えたらここが壊れるようにしてある。
 */
export function getNavigablePreviousPeriod(
  period: DatePeriod,
): DatePeriod | undefined {
  switch (period) {
    case "thisWeek":
      return "lastWeek";
    case "thisMonth":
      return "lastMonth";
    // さらに前の期間は期間選択に無いため遷移先を持たない
    case "lastWeek":
    case "lastMonth":
      return undefined;
    default: {
      const exhaustive: never = period;
      return exhaustive;
    }
  }
}
