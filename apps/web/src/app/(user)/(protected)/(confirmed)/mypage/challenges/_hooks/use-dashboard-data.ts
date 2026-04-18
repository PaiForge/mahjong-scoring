"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { PracticeMenuType } from "@/lib/db/practice-menu-types";

import {
  getAvailableMenuTypes,
  getChallengeSessions,
} from "../_actions/get-challenge-sessions";
import {
  buildChartData,
  computePercentChange,
  computeStats,
  toSessionRows,
} from "../_lib/dashboard-utils";
import { getPeriodRange, getPreviousPeriodRange } from "../_lib/period-utils";
import type {
  ChallengeSession,
  ChartDataPoint,
  DatePeriod,
  SessionRow,
} from "../_lib/types";

const TABLE_DISPLAY_LIMIT = 5;

interface UseDashboardDataOptions {
  /** サーバーサイドでプリフェッチした利用可能メニュー種別 */
  readonly initialMenuTypes: readonly PracticeMenuType[];
  /** サーバーサイドでプリフェッチした初期セッションデータ */
  readonly initialSessions: {
    readonly current: readonly ChallengeSession[];
    readonly previous: readonly ChallengeSession[];
  };
}

/**
 * ダッシュボードのデータ取得・状態管理を行うカスタムフック
 * サーバーサイドプリフェッチした初期データを受け取り、初回の fetch を省略する。
 * ダッシュボードデータフック
 */
export function useDashboardData({
  initialMenuTypes,
  initialSessions,
}: UseDashboardDataOptions) {
  const firstMenu = initialMenuTypes.length > 0 ? initialMenuTypes[0] : undefined;

  const [selectedMenu, setSelectedMenu] = useState<
    PracticeMenuType | undefined
  >(firstMenu);
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>("thisWeek");
  const [availableMenuTypes, setAvailableMenuTypes] = useState<
    PracticeMenuType[] | undefined
  >([...initialMenuTypes]);
  const [currentSessions, setCurrentSessions] = useState<ChallengeSession[]>(
    [...initialSessions.current],
  );
  const [previousSessions, setPreviousSessions] = useState<ChallengeSession[]>(
    [...initialSessions.previous],
  );
  const [isPending, startTransition] = useTransition();

  // 初期データがプリフェッチ済みなので初回 fetch をスキップするためのフラグ
  const isInitialMount = useRef(true);

  const fetchSessions = useCallback(() => {
    if (!selectedMenu) return;

    // 初回マウント時はサーバーサイドのプリフェッチデータを使用
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentRange = getPeriodRange(selectedPeriod);
    const previousRange = getPreviousPeriodRange(selectedPeriod);

    startTransition(async () => {
      const result = await getChallengeSessions(
        selectedMenu,
        currentRange.start,
        currentRange.end,
        previousRange.start,
        previousRange.end,
      );
      setCurrentSessions(result.current);
      setPreviousSessions(result.previous);
    });
  }, [selectedMenu, selectedPeriod]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const currentStats = useMemo(
    () => computeStats(currentSessions),
    [currentSessions],
  );

  const previousStats = useMemo(
    () => computeStats(previousSessions),
    [previousSessions],
  );

  const bestScoreComparison = useMemo(
    () => computePercentChange(currentStats.bestScore, previousStats.bestScore),
    [currentStats.bestScore, previousStats.bestScore],
  );

  const avgScoreComparison = useMemo(
    () =>
      computePercentChange(
        currentStats.avgCompletionScore,
        previousStats.avgCompletionScore,
      ),
    [currentStats.avgCompletionScore, previousStats.avgCompletionScore],
  );

  const chartData: ChartDataPoint[] = useMemo(
    () => buildChartData(currentSessions, previousSessions),
    [currentSessions, previousSessions],
  );

  const tableRows: SessionRow[] = useMemo(
    () => toSessionRows(currentSessions, TABLE_DISPLAY_LIMIT),
    [currentSessions],
  );

  const hasMoreResults = currentSessions.length > TABLE_DISPLAY_LIMIT;

  return {
    selectedMenu,
    setSelectedMenu,
    selectedPeriod,
    setSelectedPeriod,
    isLoading: isPending,
    availableMenuTypes,
    currentStats,
    bestScoreComparison,
    avgScoreComparison,
    chartData,
    tableRows,
    hasMoreResults,
  };
}
