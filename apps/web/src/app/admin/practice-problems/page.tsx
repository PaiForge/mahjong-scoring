import { getTranslations } from "next-intl/server";
import { createSearchParamsCache } from "nuqs/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { DailyTrendChart } from "@/app/admin/_components/daily-trend-chart";
import { AdminDateRangePicker } from "@/app/admin/_components/admin-date-range-picker";
import { AdminKpiGrid } from "@/app/admin/_components/admin-kpi-grid";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { adminChipClasses } from "@/app/admin/_lib/chip-classes";
import { resolveJstDateRange } from "@/app/admin/_lib/date-range";
import {
  dateRangeParsers,
  defaultStatsDateRange,
} from "@/app/admin/_lib/stats-search-params";
import { isPracticeProblemArchiveDisabled } from "@/lib/practice-problems/archive";

import { DailyProblemStatus } from "./_components/daily-problem-status";
import { CompositionTable } from "./_components/composition-table";
import { SourceStatsTable } from "./_components/source-stats-table";
import { buildPracticeProblemStats } from "./_lib/practice-problem-stats";
import {
  fetchPracticeProblemComposition,
  fetchPracticeProblemCounts,
  fetchPracticeProblemDailyCounts,
} from "./_lib/queries";

// nuqs のキャッシュはモジュールスコープで組み立てる必要があるため、
// 既定の期間もモジュール評価時の日付で決まる（プロセスが生きている間は固定）。
const DEFAULT_RANGE = defaultStatsDateRange(new Date());

const searchParamsCache = createSearchParamsCache({
  ...dateRangeParsers(DEFAULT_RANGE),
});

/** 節の見出し（ダッシュボードの日次推移の見出しと同じ形） */
const SECTION_HEADING_CLASSES = "mb-4 text-lg font-semibold text-surface-900";

/**
 * 問題の保存状況
 *
 * @description
 * 和了形・聴牌形の点数計算（`agari-score` / `tenpai-score`）で出題し、表
 * `practice_problems` に保存した問題の貯まり方を、SQL を書かずに読むページ。
 * 種別ごとの累計と期間内の新規保存数、種別 × 由来（web / ios / android）の数と
 * 最終保存日時、期間内の日次の新規保存数、停止スイッチの状態、種別ごとの盤面の内訳
 * （リーチ・副露あり・ツモ・親の数と割合）を出す。
 *
 * 数えるのは **保存された異なる盤面の数** で、出題した回数ではない。表は同じ盤面を
 * 1 行にまとめ、送信は取りこぼしを許し、同じ盤面の再保存では `created_at` が
 * 変わらない。「期間内」は `created_at`（その盤面が初めて保存された日時）が期間に
 * 入る行。表の性質をそのまま呼び名にし、「出題数」とは呼ばない（誤読する）。
 * この表から出せないものがあり、画面の説明文にも制約として書いている:
 * - 出題回数・出題の分布（同じ盤面は 1 行、送信は取りこぼしを許す）
 * - 利用者ごとの数・正答率（ユーザー ID も解答も持たない。管理者・開発用アカウントの
 *   出題も除けずに数に入る）
 * - 翻・符・点数・役の分布（盤面からの派生値で、全行を読んで組み立て直す必要があり、
 *   ルール設定でも値が変わる）
 * - 保存された盤面 1 件ずつの閲覧（このページの範囲外）
 *
 * 期間は URL の `from` / `to`（JST の日付、既定は直近 28 日）で、ほかの統計ページと
 * 同じ `DateRangePicker` で選ぶ。並び替えは持たない（由来の表の行は 6 つ）。
 *
 * @design ダッシュボードの節にせず、「統計」グループの 3 つ目の独立したページにする
 * レッスン・チャレンジの統計ページと同じ並び・同じ期間ピッカーにすると覚えることが
 * 増えない。ダッシュボード（新規ユーザーの KPI + 折れ線）に節として足すと、1 枚の
 * ローディング境界と 1 つの期間ピッカーに別の関心が乗る。
 *
 * @design 停止スイッチの状態を見出しの下に出す
 * `PRACTICE_PROBLEM_ARCHIVE_DISABLED` の状態（収集中 / 停止中）は、「増えていない」の
 * 原因が停止なのか利用が無いのかを切り分ける最初の情報。環境変数はデプロイ単位なので、
 * このページを描いたサーバーの値 = 保存 API の値になる。
 *
 * @design 日次推移は合計の 1 系列にする
 * 既存の `DailyTrendChart` をそのまま使う。種別・由来ごとの期間内の数は由来の表に
 * あり、系列を増やすにはチャート部品の作り替えが要る。
 *
 * @design 保存された盤面の一覧は持たない
 * 盤面 1 件ずつの閲覧は、組み立て直して牌で描く別の仕組みが要るので、このページでは
 * 数だけを出す。
 *
 * @flow 期間を選ぶ（既定は直近 28 日）→ 収集中か停止中かを見る → KPI で期間内の
 * 新規保存数と累計を見る → 日次推移で増え方を見る → 由来の表で入口ごとの届き方と
 * 最終保存日時を見る → 内訳の表でどんな盤面が貯まっているかを見る
 */
export default async function AdminPracticeProblemStatsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();

  const { from, to } = await searchParamsCache.parse(searchParams);
  const range = resolveJstDateRange(from, to, DEFAULT_RANGE);
  const [t, tAdmin, counts, daily, composition] = await Promise.all([
    getTranslations("admin.practiceProblemStats"),
    getTranslations("admin"),
    fetchPracticeProblemCounts(range),
    fetchPracticeProblemDailyCounts(range),
    fetchPracticeProblemComposition(),
  ]);
  const stats = buildPracticeProblemStats(counts);
  const period = `${range.startDate} ~ ${range.endDate}`;
  const archiveDisabled = isPracticeProblemArchiveDisabled();

  const kpis = [
    {
      key: "all",
      label: t("kpi.all"),
      value: stats.inPeriod,
      cumulative: stats.total,
    },
    ...stats.kindTotals.map((kindTotal) => ({
      key: kindTotal.kind,
      // 例: admin.practiceProblemStats.kinds.agari-score
      label: t("kpi.byKind", { kind: t(`kinds.${kindTotal.kind}`) }),
      value: kindTotal.inPeriod,
      cumulative: kindTotal.total,
    })),
  ];

  return (
    <>
      <AdminPageTitle className="mb-2">{t("title")}</AdminPageTitle>
      <p className="mb-4 text-sm text-surface-600">{t("description")}</p>
      <p className="mb-6 flex items-center gap-2 text-sm text-surface-600">
        <span>{t("collection.label")}</span>
        <span
          className={adminChipClasses(archiveDisabled ? "neutral" : "success")}
        >
          {archiveDisabled ? t("collection.stopped") : t("collection.active")}
        </span>
      </p>

      <div className="space-y-6">
        <DailyProblemStatus />
        <AdminDateRangePicker
          startDate={range.startDate}
          endDate={range.endDate}
        />

        <AdminKpiGrid
          items={kpis}
          period={period}
          columns={3}
          formatCumulative={(count) => t("kpi.cumulative", { count })}
        />

        <section className="admin-panel p-6">
          <h3 className={SECTION_HEADING_CLASSES}>{t("dailyTrends")}</h3>
          <DailyTrendChart
            data={daily}
            seriesLabel={t("chartSeries")}
            emptyMessage={tAdmin("dashboardKpi.noData")}
          />
        </section>

        <section>
          <h3 className={SECTION_HEADING_CLASSES}>{t("sourceTable.title")}</h3>
          <SourceStatsTable rows={stats.rows} maxTotal={stats.maxTotal} />
        </section>

        <section>
          <h3 className={SECTION_HEADING_CLASSES}>{t("composition.title")}</h3>
          <p className="mb-4 text-sm text-surface-600">
            {t("composition.note")}
          </p>
          <CompositionTable rows={composition} />
        </section>
      </div>
    </>
  );
}
