import { getTranslations } from "next-intl/server";
import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { AdminTabs } from "@/app/admin/_components/admin-tabs";
import { DateRangePicker } from "@/app/admin/_components/date-range-picker";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { daysAgo, today } from "@/app/admin/_lib/dashboard";

import { LessonStatsTable } from "./_components/lesson-stats-table";
import { resolveJstDateRange } from "./_lib/date-range";
import {
  buildLessonStats,
  LESSON_STATS_SORTS,
  type LessonStatsSort,
} from "./_lib/lesson-stats";
import { fetchLessonCompletionCounts } from "./_lib/queries";

// nuqs のキャッシュはモジュールスコープで組み立てる必要があるため、
// 既定の期間もモジュール評価時の日付で決まる（プロセスが生きている間は固定）。
const defaultsResolvedAt = new Date();
const DEFAULT_RANGE = {
  startDate: daysAgo(28, defaultsResolvedAt),
  endDate: today(defaultsResolvedAt),
} as const;

const searchParamsCache = createSearchParamsCache({
  from: parseAsString.withDefault(DEFAULT_RANGE.startDate),
  to: parseAsString.withDefault(DEFAULT_RANGE.endDate),
  // 未指定・不正値は順路順
  sort: parseAsStringLiteral(LESSON_STATS_SORTS).withDefault("curriculum"),
});

/** 期間を保ったまま並び順だけを変える URL */
function sortHref(
  startDate: string,
  endDate: string,
  sort: LessonStatsSort,
): string {
  const params = new URLSearchParams({ from: startDate, to: endDate, sort });
  return `/admin/lessons?${params.toString()}`;
}

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
 * サイドナビでは「概要」のグループでダッシュボードの次に置く。
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
  const [t, tAdmin, counts] = await Promise.all([
    getTranslations("admin.lessonStats"),
    getTranslations("admin"),
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
        <DateRangePicker
          startDate={range.startDate}
          endDate={range.endDate}
          labels={{
            from: tAdmin("dashboardKpi.from"),
            to: tAdmin("dashboardKpi.to"),
            presets: tAdmin("dashboardKpi.presets"),
            past7days: tAdmin("dashboardKpi.past7days"),
            past28days: tAdmin("dashboardKpi.past28days"),
            past90days: tAdmin("dashboardKpi.past90days"),
          }}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {kpis.map((kpi) => (
            <section key={kpi.label} className="admin-kpi space-y-2">
              <p className="text-sm font-medium text-surface-600">
                {kpi.label}
              </p>
              <p className="text-5xl leading-[56px] font-semibold tracking-tight text-primary-900 tabular-nums">
                {kpi.value.toLocaleString("ja-JP")}
              </p>
              <p className="text-xs text-surface-500">
                {t("kpi.cumulative", {
                  count: kpi.cumulative.toLocaleString("ja-JP"),
                })}
              </p>
              <p className="text-xs text-surface-500">{period}</p>
            </section>
          ))}
        </div>

        <AdminTabs
          label={t("sort.label")}
          tabs={LESSON_STATS_SORTS.map((key) => ({
            href: sortHref(range.startDate, range.endDate, key),
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
