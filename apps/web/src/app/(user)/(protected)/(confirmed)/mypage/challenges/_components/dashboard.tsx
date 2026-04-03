"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { SectionTitle } from "@/app/_components/section-title";
import { isPracticeMenuType } from "@/lib/db/practice-menu-types";

import {
  getComparisonLabel,
  getNavigablePreviousPeriod,
  getPreviousPeriodLabel,
} from "../_lib/dashboard-utils";
import type { DatePeriod } from "../_lib/types";
import { isDatePeriod } from "../_lib/types";
import { useDashboardData } from "../_hooks/use-dashboard-data";
import { DashboardContentSkeleton, DashboardSkeleton } from "./dashboard-skeleton";
import { ScoreChart } from "./score-chart";
import { SessionHistoryTable } from "./session-history-table";
import { StatsCard } from "./stats-card";

/**
 * 期間選択は意図的に固定期間のみ提供している。
 * 理由: (1) 古いデータは練習の成長指標として参考にならない
 * (2) 定期的なデータクリーンアップを想定しており、長期間のデータ保持を前提としない
 */
const DATE_PERIODS: readonly DatePeriod[] = [
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
];

const selectClassName =
  "px-3 py-2 rounded-lg border border-surface-200 bg-surface-50 text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

/**
 * マイレコードのダッシュボード本体。
 * フィルター、KPIカード、チャート、履歴テーブルを表示する。
 * ダッシュボード
 */
export function Dashboard() {
  const t = useTranslations("mypageChallenges");
  const {
    selectedMenu,
    setSelectedMenu,
    selectedPeriod,
    setSelectedPeriod,
    isLoading,
    availableMenuTypes,
    currentStats,
    bestScoreComparison,
    avgScoreComparison,
    chartData,
    tableRows,
    hasMoreResults,
  } = useDashboardData();

  const comparisonLabel = getComparisonLabel(selectedPeriod, t);
  const navigablePrevPeriod = getNavigablePreviousPeriod(selectedPeriod);

  if (
    availableMenuTypes === undefined ||
    (isLoading && availableMenuTypes.length === 0)
  ) {
    return <DashboardSkeleton />;
  }

  if (availableMenuTypes.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <p>{t("noData")}</p>
      </div>
    );
  }

  const menuOptions = availableMenuTypes.map((type) => ({
    value: type,
    label: t(`menuTypes.${type}`),
  }));

  return (
    <div className="space-y-6 overflow-x-hidden">
      <SectionTitle>{t("records")}</SectionTitle>

      <select
        value={selectedPeriod}
        onChange={(e) => {
          const value = e.target.value;
          if (isDatePeriod(value)) setSelectedPeriod(value);
        }}
        className={`block w-full sm:w-48 ${selectClassName}`}
      >
        {DATE_PERIODS.map((period) => (
          <option key={period} value={period}>
            {t(`periods.${period}`)}
          </option>
        ))}
      </select>

      <select
        value={selectedMenu ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          if (isPracticeMenuType(value)) setSelectedMenu(value);
        }}
        className={`block w-full sm:w-64 ${selectClassName}`}
      >
        {menuOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {isLoading ? (
        <DashboardContentSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              label={t("bestScore")}
              value={
                currentStats.bestScore !== undefined
                  ? currentStats.bestScore.toString()
                  : "-"
              }
              comparison={{
                percentChange: bestScoreComparison,
                absoluteChange: undefined,
                label: comparisonLabel,
              }}
            />
            <StatsCard
              label={t("avgScore")}
              value={
                currentStats.avgCompletionScore !== undefined
                  ? currentStats.avgCompletionScore.toFixed(1)
                  : "-"
              }
              tooltip={t("avgScoreTooltip")}
              comparison={{
                percentChange: avgScoreComparison,
                absoluteChange: undefined,
                label: comparisonLabel,
              }}
            />
          </div>

          <div className="min-w-0 overflow-hidden">
            <h3 className="text-sm md:text-base font-medium text-surface-500">
              {t("scoreTrend")}
            </h3>
            <div className="mt-4">
              <ScoreChart
                data={chartData}
                emptyMessage={t("noData")}
                yAxisLabel={t("scoreUnit")}
                currentLabel={t(`periods.${selectedPeriod}`)}
                previousLabel={t(
                  `periods.${getPreviousPeriodLabel(selectedPeriod)}`,
                )}
                onPreviousLabelClick={
                  navigablePrevPeriod
                    ? () => setSelectedPeriod(navigablePrevPeriod)
                    : undefined
                }
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm md:text-base font-medium text-surface-500">
              {t("sessionHistory")}
            </h3>
            <div className="mt-4">
              <SessionHistoryTable
                sessions={tableRows}
                emptyMessage={t("noData")}
                headers={{
                  date: t("tableDate"),
                  correctAnswers: t("tableCorrectAnswers"),
                  incorrectAnswers: t("tableIncorrectAnswers"),
                }}
              />
            </div>
            {hasMoreResults && (
              <div className="text-center mt-3">
                <Link
                  href="/mypage/challenges/results"
                  className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
                >
                  {t("viewAllResults")}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
