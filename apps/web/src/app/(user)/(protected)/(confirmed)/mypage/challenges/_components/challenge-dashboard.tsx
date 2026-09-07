"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { SectionTitle } from "@/app/(user)/_components/section-title";

import { boardLabel } from "../_lib/board-label";
import {
  getComparisonLabel,
  getNavigablePreviousPeriod,
  getPreviousPeriodLabel,
} from "../_lib/dashboard-utils";
import type { ChallengeAttempt, DatePeriod, RecordBoard } from "../_lib/types";
import { isDatePeriod, recordBoardKey } from "../_lib/types";
import { useDashboardData } from "../_hooks/use-dashboard-data";
import {
  DashboardContentSkeleton,
  DashboardSkeleton,
} from "./dashboard-skeleton";
import { AttemptHistoryTable } from "./attempt-history-table";
import { StatsCard } from "./stats-card";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PracticeLinkButton } from "@/app/(user)/_components/practice-link-button";
import { practiceHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import { menuTypeToSlug } from "@/lib/db/practice-menu-types";

const ScoreChart = dynamic(
  () => import("./score-chart").then((mod) => mod.ScoreChart),
  {
    ssr: false,
    loading: () => <SkeletonBar radius="lg" className="h-[250px] w-full" />,
  },
);

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
  "px-3 py-2 rounded-lg border-3 border-ink bg-surface-50 text-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400";

interface ChallengeDashboardProps {
  /** サーバーサイドでプリフェッチした、記録を持つ土俵の一覧 */
  readonly initialBoards: readonly RecordBoard[];
  /** 初期選択の土俵（`?menu=&variant=` の指定、無ければ先頭） */
  readonly initialBoard: RecordBoard | undefined;
  /** サーバーサイドでプリフェッチした初期チャレンジデータ（デフォルト期間・初期選択の土俵） */
  readonly initialAttempts: {
    readonly current: readonly ChallengeAttempt[];
    readonly previous: readonly ChallengeAttempt[];
  };
}

/**
 * マイレコードのダッシュボード本体。
 * フィルター、KPIカード、チャート、履歴テーブルを表示する。
 * サーバーサイドでプリフェッチした初期データを受け取り、初回の useEffect を省略する。
 * ダッシュボード
 */
export function ChallengeDashboard({
  initialBoards,
  initialBoard,
  initialAttempts,
}: ChallengeDashboardProps) {
  const t = useTranslations("mypage.challenges");
  const tRoot = useTranslations();
  const {
    selectedBoard,
    setSelectedBoard,
    selectedPeriod,
    setSelectedPeriod,
    isLoading,
    availableBoards,
    currentStats,
    bestScoreComparison,
    avgScoreComparison,
    chartData,
    tableRows,
    hasMoreResults,
  } = useDashboardData({ initialBoards, initialBoard, initialAttempts });

  const comparisonLabel = getComparisonLabel(selectedPeriod, t);
  const navigablePrevPeriod = getNavigablePreviousPeriod(selectedPeriod);

  const handlePeriodChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (isDatePeriod(value)) setSelectedPeriod(value);
    },
    [setSelectedPeriod],
  );

  const handleBoardChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      // select の value は土俵キー。一覧に無い値（改竄）は無視する
      const board = (availableBoards ?? []).find(
        (candidate) => recordBoardKey(candidate) === e.target.value,
      );
      if (board) setSelectedBoard(board);
    },
    [availableBoards, setSelectedBoard],
  );

  // useCallback ではなく useMemo を使用: undefined を返すケースがあるため
  const handlePreviousPeriodClick = useMemo(
    () =>
      navigablePrevPeriod
        ? () => setSelectedPeriod(navigablePrevPeriod)
        : undefined,
    [navigablePrevPeriod, setSelectedPeriod],
  );

  const boardOptions = useMemo(
    () =>
      (availableBoards ?? []).map((board) => ({
        value: recordBoardKey(board),
        label: boardLabel(board, tRoot),
      })),
    [availableBoards, tRoot],
  );

  if (
    availableBoards === undefined ||
    (isLoading && availableBoards.length === 0)
  ) {
    return <DashboardSkeleton />;
  }

  if (availableBoards.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-surface-500">{t("noData")}</p>
        {/* 記録が 1 件も無い人にとって、このページは行き止まりになる。
            記録を作れる唯一の場所である練習一覧へ送る */}
        <LinkButton href="/practice" className="mt-6">
          {t("goToPractice")}
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <SectionTitle>{t("records")}</SectionTitle>

      <select
        value={selectedPeriod}
        onChange={handlePeriodChange}
        className={`block w-full sm:w-48 ${selectClassName}`}
      >
        {DATE_PERIODS.map((period) => (
          <option key={period} value={period}>
            {t(`periods.${period}`)}
          </option>
        ))}
      </select>

      <select
        value={selectedBoard ? recordBoardKey(selectedBoard) : ""}
        onChange={handleBoardChange}
        className={`block w-full sm:w-64 ${selectClassName}`}
      >
        {boardOptions.map((opt) => (
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
                change: bestScoreComparison,
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
                change: avgScoreComparison,
                label: comparisonLabel,
                // 値自身が `toFixed(1)` のため、増減も小数第 1 位で揃える
                fractionDigits: 1,
              }}
            />
          </div>

          <div className="min-w-0 overflow-hidden space-y-4">
            <h3 className="text-sm md:text-base font-medium text-surface-500">
              {t("scoreTrend")}
            </h3>
            <ScoreChart
              data={chartData}
              emptyMessage={t("noData")}
              yAxisLabel={t("scoreUnit")}
              currentLabel={t(`periods.${selectedPeriod}`)}
              previousLabel={t(
                `periods.${getPreviousPeriodLabel(selectedPeriod)}`,
              )}
              onPreviousLabelClick={handlePreviousPeriodClick}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm md:text-base font-medium text-surface-500">
              {t("recentHistory")}
            </h3>
            <AttemptHistoryTable
              attempts={tableRows}
              emptyMessage={t("noData")}
              headers={{
                date: t("tableDate"),
                correctAnswers: t("tableCorrectAnswers"),
                incorrectAnswers: t("tableIncorrectAnswers"),
              }}
            />
            {hasMoreResults && (
              <div className="text-center">
                <Link
                  href="/mypage/challenges/results"
                  className={`text-sm ${TEXT_LINK_CLASSES}`}
                >
                  {t("viewAllResults")}
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* 見ている土俵をそのまま解き直す導線。
          行き先は play ではなく練習の説明ページにする — 記録を眺めていた人が
          押した次の瞬間にカウントダウンが始まるのは重く、チャレンジと
          トレーニングのどちらで解き直すかもここでは決まっていない。
          選択中のバリアントを `?variant=` で運ぶので、説明ページの
          選択パネルはその設定を選んだ状態で開く（記録が積まれている土俵と
          そのまま始めたときの土俵が一致する）。
          読み込み中も出しっぱなしにするのは、リンク先が選択した土俵だけで
          決まり、成績の取得を待つ必要が無いため */}
      {selectedBoard && (
        <div className="pt-4 border-t-2 border-dashed border-border/40">
          <PracticeLinkButton
            href={practiceHref(
              menuTypeToSlug(selectedBoard.menuType),
              selectedBoard.variant,
            )}
            label={t("tryChallenge", {
              title: boardLabel(selectedBoard, tRoot),
            })}
          />
        </div>
      )}
    </div>
  );
}
