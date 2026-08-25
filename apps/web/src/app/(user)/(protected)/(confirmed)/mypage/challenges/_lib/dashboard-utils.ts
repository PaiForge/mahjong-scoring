import type { useTranslations } from "next-intl";

import { practiceMenuByType } from "@/lib/db/practice-menu-types";

import type {
  ChallengeSession,
  ChartDataPoint,
  DatePeriod,
  SessionRow,
} from "./types";

/**
 * 日付を MM/DD HH:mm 形式にフォーマットする
 * 日付フォーマット
 */
export function formatDate(date: Date | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ja", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * 日付を短縮形式（月/日）にフォーマットする
 * 短縮日付フォーマット
 */
export function formatShortDate(date: Date | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ja", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * 期間に応じた比較ラベルを返す
 * 比較ラベル取得
 */
export function getComparisonLabel(
  period: DatePeriod,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (period) {
    case "thisWeek":
      return t("vsLastWeek");
    case "lastWeek":
      return t("vs2WeeksAgo");
    case "thisMonth":
      return t("vsLastMonth");
    case "lastMonth":
      return t("vs2MonthsAgo");
  }
}

/**
 * 前の期間のラベルキーを返す
 * 前期間ラベルキー
 */
export function getPreviousPeriodLabel(period: DatePeriod): string {
  switch (period) {
    case "thisWeek":
      return "lastWeek";
    case "lastWeek":
      return "twoWeeksAgo";
    case "thisMonth":
      return "lastMonth";
    case "lastMonth":
      return "twoMonthsAgo";
  }
}

/**
 * 凡例クリックで遷移可能な前の期間を返す。不可なら undefined。
 * 遷移可能な前期間
 */
export function getNavigablePreviousPeriod(
  period: DatePeriod,
): DatePeriod | undefined {
  switch (period) {
    case "thisWeek":
      return "lastWeek";
    case "thisMonth":
      return "lastMonth";
    default:
      return undefined;
  }
}

/**
 * 完走判定: ミス上限に達せず終了したセッション
 * 完走判定
 *
 * ミス上限は練習ごとに異なる（昇級試験は1回）ため、全体定数ではなく
 * その練習のレジストリ値と突き合わせる。
 */
export function isCompletedSession(session: ChallengeSession): boolean {
  return (
    session.incorrectAnswers < practiceMenuByType(session.menuType).mistakeLimit
  );
}

/**
 * セッション配列からベストスコアと平均完走スコアを算出する
 * 統計算出
 */
export function computeStats(sessions: readonly ChallengeSession[]) {
  const scores = sessions.map((s) => s.score);

  const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;

  const completedScores = sessions
    .filter(isCompletedSession)
    .map((s) => s.score);

  const avgCompletionScore =
    completedScores.length > 0
      ? completedScores.reduce((sum, v) => sum + v, 0) / completedScores.length
      : undefined;

  return { bestScore, avgCompletionScore, totalSessions: sessions.length };
}

/**
 * 現在値と前期間値の変化率を計算する
 * 変化率計算
 */
export function computePercentChange(
  current: number | undefined,
  previous: number | undefined,
): number | undefined {
  if (current === undefined || previous === undefined || previous === 0)
    return undefined;
  return ((current - previous) / previous) * 100;
}

interface DailyAggregation {
  readonly date: string;
  readonly dateKey: string;
  readonly avgScore: number;
}

/**
 * セッションを日ごとに集約して平均スコアを算出する
 * 日別集約
 */
export function aggregateByDay(
  sessions: readonly ChallengeSession[],
): DailyAggregation[] {
  const dailyMap = new Map<
    string,
    { total: number; count: number; dateLabel: string }
  >();

  for (const s of sessions) {
    const d = new Date(s.createdAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const existing = dailyMap.get(dateKey);
    if (existing) {
      existing.total += s.score;
      existing.count += 1;
    } else {
      dailyMap.set(dateKey, {
        total: s.score,
        count: 1,
        dateLabel: formatShortDate(s.createdAt),
      });
    }
  }

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, { total, count, dateLabel }]) => ({
      date: dateLabel,
      dateKey,
      avgScore: Math.round((total / count) * 10) / 10,
    }));
}

/**
 * ミス数に応じたカラークラスを返す
 * ミスカラークラス
 */
export function getMissColorClass(incorrectAnswers: number): string {
  if (incorrectAnswers === 0) return "text-foreground";
  if (incorrectAnswers <= 1) return "text-warning";
  return "text-destructive";
}

/**
 * セッション配列からテーブル表示用の行データを生成する
 * テーブル行変換
 */
export function toSessionRows(
  sessions: readonly ChallengeSession[],
  limit = 5,
): SessionRow[] {
  return sessions.slice(0, limit).map((s) => ({
    date: formatDate(s.createdAt),
    correctAnswers: String(s.score),
    incorrectAnswers: s.incorrectAnswers,
  }));
}

/**
 * 2つの期間データからチャート用データポイント配列を生成する
 * チャートデータ生成
 */
export function buildChartData(
  currentSessions: readonly ChallengeSession[],
  previousSessions: readonly ChallengeSession[],
): ChartDataPoint[] {
  const currentDaily = aggregateByDay(currentSessions);
  const previousDaily = aggregateByDay(previousSessions);

  const allDateKeys = new Set([
    ...currentDaily.map((d) => d.dateKey),
    ...previousDaily.map((d) => d.dateKey),
  ]);

  const currentMap = new Map(currentDaily.map((d) => [d.dateKey, d]));
  const previousMap = new Map(previousDaily.map((d) => [d.dateKey, d]));

  return Array.from(allDateKeys)
    .sort()
    .map((dateKey) => {
      const currentEntry = currentMap.get(dateKey);
      const previousEntry = previousMap.get(dateKey);
      const displayDate = currentEntry?.date ?? previousEntry?.date ?? dateKey;
      return {
        date: displayDate,
        dateKey,
        score: currentEntry?.avgScore,
        previousScore: previousEntry?.avgScore,
      };
    });
}
