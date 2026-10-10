import { practiceMenuByType } from "../practice-menu-types";
import { formatJstDateTime, JST_TIME_ZONE, jstDayKey } from "../jst";

import type { AttemptRow, ChallengeAttempt, ChartDataPoint } from "./types";

/**
 * 日付を YYYY/MM/DD HH:mm 形式にフォーマットする（JST）
 * 日付フォーマット
 *
 * 期間の境界（`period.ts`）と同じ JST で表示する。サーバーで描画する
 * 全履歴の表とクライアントで描画するダッシュボードが同じ文字列を出すため。
 */
export function formatDate(date: Date | undefined): string {
  if (!date) return "-";
  return formatJstDateTime(new Date(date));
}

/**
 * 日付を短縮形式（月/日）にフォーマットする（JST）
 * 短縮日付フォーマット
 */
export function formatShortDate(date: Date | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ja", {
    month: "short",
    day: "numeric",
    timeZone: JST_TIME_ZONE,
  }).format(new Date(date));
}

/**
 * 完走判定: ミス上限に達せず終了したチャレンジ
 * 完走判定
 *
 * ミス上限は練習ごとに異なる（昇級試験は1回）ため、全体定数ではなく
 * その練習のレジストリ値と突き合わせる。
 */
export function isCompletedAttempt(attempt: ChallengeAttempt): boolean {
  return (
    attempt.incorrectAnswers < practiceMenuByType(attempt.menuType).mistakeLimit
  );
}

/**
 * チャレンジ配列からベストスコアと平均完走スコアを算出する
 * 統計算出
 */
export function computeStats(attempts: readonly ChallengeAttempt[]) {
  const scores = attempts.map((s) => s.score);

  const bestScore = scores.length > 0 ? Math.max(...scores) : undefined;

  const completedScores = attempts
    .filter(isCompletedAttempt)
    .map((s) => s.score);

  const avgCompletionScore =
    completedScores.length > 0
      ? completedScores.reduce((sum, v) => sum + v, 0) / completedScores.length
      : undefined;

  return { bestScore, avgCompletionScore, totalAttempts: attempts.length };
}

/**
 * 現在値と前期間値の差を、その統計値と同じ単位で計算する
 * 前期間差計算
 *
 * 変化率ではなく差を返す。統計値は正解数のような小さな整数で、百分率にすると
 * 1 → 3 が「+200%」に見え、前期間が 0 なら百分率自体が定義できない。結果画面
 * の記録セクションと同じ理由（`@/lib/challenge/signed-delta` 参照）。
 *
 * どちらかの期間に比較できる値が無ければ undefined（増減行を出さない）。
 */
export function computeAbsoluteChange(
  current: number | undefined,
  previous: number | undefined,
): number | undefined {
  if (current === undefined || previous === undefined) return undefined;
  return current - previous;
}

interface DailyAggregation {
  readonly date: string;
  readonly dateKey: string;
  readonly avgScore: number;
}

/**
 * チャレンジを日ごとに集約して平均スコアを算出する
 * 日別集約
 *
 * 「日」は JST で切る。期間の境界と同じ基準にしないと、JST の 0〜9 時の
 * チャレンジがサーバー（UTC）では前日の点に乗る。
 */
export function aggregateByDay(
  attempts: readonly ChallengeAttempt[],
): DailyAggregation[] {
  const dailyMap = new Map<
    string,
    { total: number; count: number; dateLabel: string }
  >();

  for (const s of attempts) {
    const dateKey = jstDayKey(new Date(s.createdAt));
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
 * チャレンジ配列からテーブル表示用の行データを生成する
 * テーブル行変換
 */
export function toAttemptRows(
  attempts: readonly ChallengeAttempt[],
  limit = 5,
): AttemptRow[] {
  return attempts.slice(0, limit).map((s) => ({
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
  currentAttempts: readonly ChallengeAttempt[],
  previousAttempts: readonly ChallengeAttempt[],
): ChartDataPoint[] {
  const currentDaily = aggregateByDay(currentAttempts);
  const previousDaily = aggregateByDay(previousAttempts);

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
