"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import type { PracticeMenuType } from "@/lib/db/practice-menu-types";

import { getChallengeAttempts } from "../_actions/get-challenge-attempts";
import {
  buildChartData,
  computeAbsoluteChange,
  computeStats,
  toAttemptRows,
} from "../_lib/dashboard-utils";
import { getPeriodRange, getPreviousPeriodRange } from "../_lib/period-utils";
import type {
  ChallengeAttempt,
  ChartDataPoint,
  DatePeriod,
  AttemptRow,
} from "../_lib/types";

const TABLE_DISPLAY_LIMIT = 5;

interface UseDashboardDataOptions {
  /** サーバーサイドでプリフェッチした利用可能メニュー種別 */
  readonly initialMenuTypes: readonly PracticeMenuType[];
  /**
   * 初期選択の練習種別。`initialAttempts` がどの種別のデータかを表すため、
   * プリフェッチと同じ値を渡すこと（食い違うと初回描画だけ別種別のデータが出る）。
   */
  readonly initialMenu: PracticeMenuType | undefined;
  /** サーバーサイドでプリフェッチした初期チャレンジデータ */
  readonly initialAttempts: {
    readonly current: readonly ChallengeAttempt[];
    readonly previous: readonly ChallengeAttempt[];
  };
}

/**
 * ダッシュボードのデータ取得・状態管理を行うカスタムフック
 * サーバーサイドプリフェッチした初期データを受け取り、初回の fetch を省略する。
 * ダッシュボードデータフック
 */
export function useDashboardData({
  initialMenuTypes,
  initialMenu,
  initialAttempts,
}: UseDashboardDataOptions) {
  const [selectedMenu, setSelectedMenu] = useState<
    PracticeMenuType | undefined
  >(initialMenu);
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>("thisWeek");
  const [availableMenuTypes] = useState<PracticeMenuType[] | undefined>([
    ...initialMenuTypes,
  ]);
  const [currentAttempts, setCurrentAttempts] = useState<ChallengeAttempt[]>([
    ...initialAttempts.current,
  ]);
  const [previousAttempts, setPreviousAttempts] = useState<ChallengeAttempt[]>([
    ...initialAttempts.previous,
  ]);
  const [isPending, startTransition] = useTransition();

  // 初期データがプリフェッチ済みなので初回 fetch をスキップするためのフラグ
  const isInitialMount = useRef(true);

  const fetchAttempts = useCallback(() => {
    if (!selectedMenu) return;

    // 初回マウント時はサーバーサイドのプリフェッチデータを使用
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 現在期間と前期間で同じ「今」を基準にするため、ここで1回だけ解決する
    const now = new Date();
    const currentRange = getPeriodRange(selectedPeriod, now);
    const previousRange = getPreviousPeriodRange(selectedPeriod, now);

    startTransition(async () => {
      const result = await getChallengeAttempts(
        selectedMenu,
        currentRange.start,
        currentRange.end,
        previousRange.start,
        previousRange.end,
      );
      setCurrentAttempts(result.current);
      setPreviousAttempts(result.previous);
    });
  }, [selectedMenu, selectedPeriod]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const currentStats = useMemo(
    () => computeStats(currentAttempts),
    [currentAttempts],
  );

  const previousStats = useMemo(
    () => computeStats(previousAttempts),
    [previousAttempts],
  );

  const bestScoreComparison = useMemo(
    () =>
      computeAbsoluteChange(currentStats.bestScore, previousStats.bestScore),
    [currentStats.bestScore, previousStats.bestScore],
  );

  const avgScoreComparison = useMemo(
    () =>
      computeAbsoluteChange(
        currentStats.avgCompletionScore,
        previousStats.avgCompletionScore,
      ),
    [currentStats.avgCompletionScore, previousStats.avgCompletionScore],
  );

  const chartData: ChartDataPoint[] = useMemo(
    () => buildChartData(currentAttempts, previousAttempts),
    [currentAttempts, previousAttempts],
  );

  const tableRows: AttemptRow[] = useMemo(
    () => toAttemptRows(currentAttempts, TABLE_DISPLAY_LIMIT),
    [currentAttempts],
  );

  const hasMoreResults = currentAttempts.length > TABLE_DISPLAY_LIMIT;

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
