import type { PracticeBoard } from "../practice-menu-types";

/**
 * チャレンジダッシュボードの共通型定義
 * マイレコード型
 */

/**
 * 期間選択の有効値（選択肢の並び順）
 * 期間選択肢
 *
 * 期間選択は意図的に固定期間のみ提供している。
 * 理由: (1) 古いデータは練習の成長指標として参考にならない
 * (2) 定期的なデータクリーンアップを想定しており、長期間のデータ保持を前提としない
 */
export const DATE_PERIOD_VALUES = [
  "thisWeek",
  "lastWeek",
  "thisMonth",
  "lastMonth",
] as const;

/** 期間選択 */
export type DatePeriod = (typeof DATE_PERIOD_VALUES)[number];

/**
 * 値が DatePeriod かどうかを判定する型ガード
 * 期間選択型ガード
 */
const datePeriodSet: ReadonlySet<string> = new Set(DATE_PERIOD_VALUES);

export function isDatePeriod(value: unknown): value is DatePeriod {
  return typeof value === "string" && datePeriodSet.has(value);
}

/**
 * チャレンジ1件分のデータ
 * チャレンジ
 */
export interface ChallengeAttempt extends PracticeBoard {
  readonly id: string;
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly createdAt: Date;
}

/**
 * 比較用の統計データ
 * 統計値
 */
export interface StatData {
  readonly value: number | undefined;
  readonly previousValue: number | undefined;
  readonly percentChange: number | undefined;
}

/**
 * チャートの1データポイント
 * チャートデータポイント
 */
export interface ChartDataPoint {
  readonly date: string;
  readonly dateKey: string;
  readonly score: number | undefined;
  readonly previousScore: number | undefined;
}

/**
 * チャレンジ履歴テーブルの1行
 * チャレンジ履歴行
 */
export interface AttemptRow {
  readonly date: string;
  readonly correctAnswers: string;
  readonly incorrectAnswers: number;
}
