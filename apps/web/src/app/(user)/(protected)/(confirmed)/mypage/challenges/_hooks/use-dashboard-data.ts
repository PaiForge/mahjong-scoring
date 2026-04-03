"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

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

/**
 * ダッシュボードのデータ取得・状態管理を行うカスタムフック
 * ダッシュボードデータフック
 */
export function useDashboardData() {
  const [selectedMenu, setSelectedMenu] = useState<
    PracticeMenuType | undefined
  >(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>("thisWeek");
  const [availableMenuTypes, setAvailableMenuTypes] = useState<
    PracticeMenuType[] | undefined
  >(undefined);
  const [currentSessions, setCurrentSessions] = useState<ChallengeSession[]>(
    [],
  );
  const [previousSessions, setPreviousSessions] = useState<ChallengeSession[]>(
    [],
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const types = await getAvailableMenuTypes();
      setAvailableMenuTypes(types);
      if (types.length > 0 && !selectedMenu) {
        setSelectedMenu(types[0]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回のみ
  }, []);

  const fetchSessions = useCallback(() => {
    if (!selectedMenu) return;

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
