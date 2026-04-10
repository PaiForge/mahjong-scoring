/**
 * EXP アクティビティヒートマップ用の純粋関数群
 * ヒートマップユーティリティ
 *
 * 色レベル計算・日付範囲生成・週バケット化などを提供する。
 * React / DB / i18n に依存しないため単独でテスト可能。
 */

/** デスクトップヒートマップで表示する週数 */
export const DESKTOP_WEEKS = 46;

/** 日付境界として扱うタイムゾーン（固定）。ja ユーザー向けに JST。 */
export const HEATMAP_TIME_ZONE = 'Asia/Tokyo';

/**
 * 任意の `now` を JST の年月日に正規化して、その日の 00:00 (ローカル TZ) を表す `Date` を返す。
 *
 * `Intl.DateTimeFormat` で TZ 非依存に JST の `YYYY/MM/DD` を取得し、
 * 同じ日付を `new Date(y, m, d)` で生成することで、以降のヒートマップ計算
 * （週揃え・日付範囲生成）が Node のランタイム TZ に関係なく JST 基準で動くようにする。
 *
 * 返り値の `Date` 自体はローカル TZ 表現だが、`getFullYear`/`getMonth`/`getDate`/`getDay`
 * が JST の「その日」と一致することが重要であり、`formatDate()` と組み合わせて使う。
 */
export function getJstTodayDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: HEATMAP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const lookup: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') lookup[p.type] = p.value;
  }
  const y = Number(lookup.year);
  const m = Number(lookup.month);
  const d = Number(lookup.day);
  return new Date(y, m - 1, d);
}

/**
 * 指定された EXP 量に対する 0-4 の強度レベルを返す。
 *
 * レベル 0 は活動なし。レベル 1-4 はウィンドウ内の最大値に対する
 * 比率で四分位に分割される（相対スケール）。
 */
export function getExpLevel(amount: number, maxAmount: number): number {
  if (amount <= 0 || maxAmount <= 0) return 0;

  const ratio = amount / maxAmount;

  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * startDate から endDate までの日付を 'YYYY-MM-DD' 文字列配列で返す（両端含む）。
 */
export function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * 指定された週数分の日付範囲を生成する（日曜始まりの完全な週に揃える）。
 */
export function getHeatmapDateRangeForWeeks(
  today: Date,
  totalWeeks: number,
): { startDate: Date; endDate: Date } {
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const dayOfWeek = endDate.getDay();
  const currentSunday = new Date(endDate);
  currentSunday.setDate(endDate.getDate() - dayOfWeek);

  const startDate = new Date(currentSunday);
  startDate.setDate(currentSunday.getDate() - (totalWeeks - 1) * 7);

  return { startDate, endDate };
}

/**
 * `today` で終わる直近 `days` 日分の 'YYYY-MM-DD' を昇順で返す。
 */
export function getRecentDays(today: Date, days: number): string[] {
  const result: string[] = [];
  if (days <= 0) return result;
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  current.setDate(current.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    result.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

/**
 * 週ごとの月ラベル位置を計算する。
 *
 * 各週の最初の非 null 日付の月を確認し、月が変わったらラベルを置く。
 * 連続する週にラベルが重ならないよう 2 週未満の間隔はスキップする。
 */
export function getMonthLabelsForWeeks(
  weeks: (string | null)[][],
  monthNames: readonly string[],
): { weekIdx: number; label: string }[] {
  const labels: { weekIdx: number; label: string }[] = [];
  let prevMonth: number | null = null;

  for (let i = 0; i < weeks.length; i++) {
    const firstDate = weeks[i].find((d) => d !== null);
    if (!firstDate) continue;

    const month = new Date(firstDate + 'T00:00:00Z').getUTCMonth();
    if (month !== prevMonth) {
      const lastLabel = labels[labels.length - 1];
      if (!lastLabel || i - lastLabel.weekIdx >= 2) {
        labels.push({ weekIdx: i, label: monthNames[month] });
      }
      prevMonth = month;
    }
  }

  return labels;
}

/** フラットな日付配列から週（最大 7 日ずつの列）を構築する。 */
export function buildWeeks(allDates: string[]): (string | null)[][] {
  const weeks: (string | null)[][] = [];
  let currentWeek: (string | null)[] = [];

  for (const dateStr of allDates) {
    const date = new Date(dateStr + 'T00:00:00Z');
    const dayOfWeek = date.getUTCDay(); // 0=Sunday

    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(dateStr);
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

/** Date を 'YYYY-MM-DD' にフォーマットする。 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * サーバーサイドで事前計算したヒートマップレイアウト。
 *
 * SSR 時点で JST 基準の週グリッド・月ラベル・直近 7 日を決めておくことで、
 * クライアント側の `new Date()` に起因するハイドレーションミスマッチを防ぐ。
 */
export interface HeatmapLayout {
  readonly weeks: (string | null)[][];
  readonly monthLabels: { weekIdx: number; label: string }[];
  readonly maxAmount: number;
  readonly recentDays: string[];
  readonly startDate: string;
  readonly endDate: string;
}

/**
 * 任意の `now` から、JST 基準のヒートマップレイアウトを組み立てる純粋関数。
 *
 * - `now` は通常サーバーの `new Date()` を渡す。内部で `getJstTodayDate` を通すため、
 *   ランタイム TZ に関係なく JST の「今日」を起点にする。
 * - 返り値は全てシリアライズ可能なプレーン値で、クライアントへそのまま props として渡せる。
 */
export function buildHeatmapLayout(params: {
  now: Date;
  daily: Record<string, number>;
  monthNames: readonly string[];
  recentDaysCount: number;
  totalWeeks: number;
}): HeatmapLayout {
  const { now, daily, monthNames, recentDaysCount, totalWeeks } = params;
  const today = getJstTodayDate(now);
  const { startDate, endDate } = getHeatmapDateRangeForWeeks(today, totalWeeks);
  const allDates = generateDateRange(startDate, endDate);
  const weeks = buildWeeks(allDates);
  const monthLabels = getMonthLabelsForWeeks(weeks, monthNames);
  const recentDays = getRecentDays(today, recentDaysCount);
  const maxAmount = Math.max(0, ...Object.values(daily));
  return {
    weeks,
    monthLabels,
    maxAmount,
    recentDays,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}
