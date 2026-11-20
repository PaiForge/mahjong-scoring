import { parseAsString } from "nuqs/server";

import { daysAgo, today } from "@/app/admin/_lib/dashboard";

/**
 * 統計ページの既定の期間（直近 28 日）を、基準時刻から組み立てる
 * 統計ページ既定期間
 *
 * @description
 * nuqs のキャッシュはモジュールスコープで組み立てる必要があるため、各ページが
 * モジュール評価時に `new Date()` を 1 回取って渡す（プロセスが生きている間は固定）。
 * 基準時刻を共有モジュール側で取ると、ページごとの評価時刻がそろって既定値の
 * 日付が変わりうるので、時刻はページが持ち、ここは計算だけを共有する。
 *
 * @param now - 「今日」を決める基準時刻
 */
export function defaultStatsDateRange(now: Date) {
  return { startDate: daysAgo(28, now), endDate: today(now) } as const;
}

/**
 * 期間（`from` / `to`）の検索パラメータのパーサ
 * 期間パーサ
 *
 * URL に値が無いときは `range` の 2 値になる。`createSearchParamsCache` へ展開して使う。
 */
export function dateRangeParsers(range: {
  readonly startDate: string;
  readonly endDate: string;
}) {
  return {
    from: parseAsString.withDefault(range.startDate),
    to: parseAsString.withDefault(range.endDate),
  };
}

/**
 * 期間を保ったまま並び順だけを変える URL
 * 並び順リンク
 *
 * @param basePath - 統計ページのパス（例: `/admin/lessons`）
 */
export function statsSortHref(
  basePath: string,
  startDate: string,
  endDate: string,
  sort: string,
): string {
  const params = new URLSearchParams({ from: startDate, to: endDate, sort });
  return `${basePath}?${params.toString()}`;
}
