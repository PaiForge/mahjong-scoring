import { getTranslations } from "next-intl/server";
import { createSearchParamsCache, parseAsStringLiteral } from "nuqs/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { AdminTabs } from "@/app/admin/_components/admin-tabs";
import { AdminDateRangePicker } from "@/app/admin/_components/admin-date-range-picker";
import { AdminKpiGrid } from "@/app/admin/_components/admin-kpi-grid";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { resolveJstDateRange } from "@/app/admin/_lib/date-range";
import {
  dateRangeParsers,
  defaultStatsDateRange,
  statsSortHref,
} from "@/app/admin/_lib/stats-search-params";

import { ChallengeStatsTable } from "./_components/challenge-stats-table";
import {
  buildChallengeStats,
  CHALLENGE_STATS_SORTS,
} from "./_lib/challenge-stats";
import { fetchChallengeCounts } from "./_lib/queries";

// nuqs のキャッシュはモジュールスコープで組み立てる必要があるため、
// 既定の期間もモジュール評価時の日付で決まる（プロセスが生きている間は固定）。
const DEFAULT_RANGE = defaultStatsDateRange(new Date());

const searchParamsCache = createSearchParamsCache({
  ...dateRangeParsers(DEFAULT_RANGE),
  // 未指定・不正値はレジストリ順
  sort: parseAsStringLiteral(CHALLENGE_STATS_SORTS).withDefault("registry"),
});

/**
 * チャレンジの実施状況
 *
 * @description
 * 練習ごとに、チャレンジの回数を「累計」と「期間内」、期間内の挑戦者数（distinct user）で
 * 見せる。数えるのは `challenge_results`（記録の残るチャレンジ 1 回 = 1 行）で、
 * 練習の利用全体ではない。記録には次の制約があり、画面の説明文にも書いている:
 * - トレーニング・模試・無限訓練（`agari-score` / `tenpai-score`）は記録を残さないので入らない
 * - 昇級試験は合否だけを判定して記録を残さないので入らない（表にも並べない）
 * - 出題範囲（バリアント、`leaderboard_key`）は分けず、練習（`menu_type`）ごとにまとめる
 *
 * `challenge_results` を数えるのは、チャレンジ 1 回が必ず 1 行になる追記ログだから。
 * `challenge_best_scores` は土俵ごとの自己ベスト 1 行で、回数を持たない。
 *
 * 期間は URL の `from` / `to`（JST の日付、既定は直近 28 日）で、レッスンの完了状況・
 * ダッシュボードと同じ `DateRangePicker` で選ぶ。
 *
 * @design レッスンの完了状況と別のページにする
 * 行の元（練習のレジストリ / 教本の順路）も数えるもの（回数 / 完了）も違う。サイドナビの
 * 「統計」のグループで、レッスンの完了状況の次に置く。
 *
 * @flow 期間を選ぶ（既定は直近 28 日）→ KPI で期間内の回数・挑戦したユーザー数を見る
 * → タブで並び順（練習一覧の順 / 累計の多い順 / 期間内の多い順）を切り替える
 * → 表の練習名から練習の説明ページを開いて中身を確かめる
 */
export default async function AdminChallengeStatsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { from, to, sort } = await searchParamsCache.parse(searchParams);
  const range = resolveJstDateRange(from, to, DEFAULT_RANGE);
  const [t, counts] = await Promise.all([
    getTranslations("admin.challengeStats"),
    fetchChallengeCounts(range),
  ]);
  const stats = buildChallengeStats(counts.rows, sort);
  const period = `${range.startDate} ~ ${range.endDate}`;

  const kpis = [
    {
      label: t("kpi.periodChallenges"),
      value: stats.periodChallenges,
      cumulative: stats.totalChallenges,
    },
    {
      label: t("kpi.periodChallengers"),
      value: counts.challengersInPeriod,
      cumulative: counts.challengers,
    },
  ];

  return (
    <>
      <AdminPageTitle className="mb-2">{t("title")}</AdminPageTitle>
      <p className="mb-6 text-sm text-surface-600">{t("description")}</p>

      <div className="space-y-6">
        <AdminDateRangePicker
          startDate={range.startDate}
          endDate={range.endDate}
        />

        <AdminKpiGrid
          items={kpis}
          period={period}
          columns={2}
          formatCumulative={(count) => t("kpi.cumulative", { count })}
        />

        <AdminTabs
          label={t("sort.label")}
          tabs={CHALLENGE_STATS_SORTS.map((key) => ({
            href: statsSortHref(
              "/admin/challenges",
              range.startDate,
              range.endDate,
              key,
            ),
            // 例: admin.challengeStats.sort.registry
            label: t(`sort.${key}`),
            current: sort === key,
          }))}
        />

        <ChallengeStatsTable rows={stats.rows} maxTotal={stats.maxTotal} />
      </div>
    </>
  );
}
