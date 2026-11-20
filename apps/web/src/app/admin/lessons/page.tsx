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

import { LessonStatsTable } from "./_components/lesson-stats-table";
import { buildLessonStats, LESSON_STATS_SORTS } from "./_lib/lesson-stats";
import { fetchLessonCompletionCounts } from "./_lib/queries";

// nuqs のキャッシュはモジュールスコープで組み立てる必要があるため、
// 既定の期間もモジュール評価時の日付で決まる（プロセスが生きている間は固定）。
const DEFAULT_RANGE = defaultStatsDateRange(new Date());

const searchParamsCache = createSearchParamsCache({
  ...dateRangeParsers(DEFAULT_RANGE),
  // 未指定・不正値は順路順
  sort: parseAsStringLiteral(LESSON_STATS_SORTS).withDefault("curriculum"),
});

/**
 * レッスンの完了状況
 *
 * @description
 * レッスン（教本の章）ごとに、完了した数を「累計」と「期間内」の 2 つで見せる。
 * 数えるのは `lesson_completions` の **完了** で、閲覧（ページを開いた数）ではない。
 * 記録には次の制約があり、画面の説明文にも書いている:
 * - 未ログインの閲覧・完了は記録されない（ログイン済みの本人の完了だけが行になる）
 * - 未ログインで終えたレッスンは、24 時間以内に同じブラウザで登録・ログインすると
 *   引き継がれ、そのとき `completed_at` は引き継いだ時刻になる（期間内の数はその日に入る）
 * - コラム（`kind: "column"`）は完了を持たないので出ない
 * - 1 人 1 レッスン 1 行なので、レッスンごとの完了数 = 完了した人数
 *
 * 累計だけだと古いレッスンが常に上に来て、最近足したレッスンや最近の動きが
 * 読めないため、期間内の数を並べる。期間は URL の `from` / `to`（JST の日付、既定は
 * 直近 28 日）で、ダッシュボードと同じ `DateRangePicker` で選ぶ — 期間の UI・URL の
 * 形を揃えると覚えることが増えない。
 *
 * @design ダッシュボードの節にせず独立したページにする
 * 表の行数はレッスン数（20 前後）ある。ダッシュボード（新規ユーザーの KPI + 折れ線）に
 * 節として足すと、1 枚のローディング境界と 1 つの期間ピッカーに 2 つの関心が乗る。
 * サイドナビでは「運営・管理」の次の「統計」のグループに置く。「概要」は運営の状況を
 * 一目で見るダッシュボードの入口で、学習の記録を集計するページはそこに混ぜない。
 *
 * @flow 期間を選ぶ（既定は直近 28 日）→ KPI で期間内の完了数・完了したユーザー数を見る
 * → タブで並び順（順路順 / 累計の多い順 / 期間内の多い順）を切り替える
 * → 表のレッスン名から `/lessons/<slug>` を開いて中身を確かめる
 */
export default async function AdminLessonStatsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { from, to, sort } = await searchParamsCache.parse(searchParams);
  const range = resolveJstDateRange(from, to, DEFAULT_RANGE);
  const [t, counts] = await Promise.all([
    getTranslations("admin.lessonStats"),
    fetchLessonCompletionCounts(range),
  ]);
  const stats = buildLessonStats(counts.rows, sort);
  const period = `${range.startDate} ~ ${range.endDate}`;

  const kpis = [
    {
      label: t("kpi.periodCompletions"),
      value: stats.periodCompletions,
      cumulative: stats.totalCompletions,
    },
    {
      label: t("kpi.periodLearners"),
      value: counts.learnersInPeriod,
      cumulative: counts.learners,
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
          tabs={LESSON_STATS_SORTS.map((key) => ({
            href: statsSortHref(
              "/admin/lessons",
              range.startDate,
              range.endDate,
              key,
            ),
            // 例: admin.lessonStats.sort.curriculum
            label: t(`sort.${key}`),
            current: sort === key,
          }))}
        />

        <LessonStatsTable rows={stats.rows} maxTotal={stats.maxTotal} />
      </div>
    </>
  );
}
