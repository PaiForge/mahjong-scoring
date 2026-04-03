import type { PracticeMenuType } from "@/lib/db/practice-menu-types";

/**
 * チャレンジダッシュボードの共通型定義
 * マイレコード型
 */

/** 期間選択の有効値 */
const DATE_PERIOD_VALUES = ["thisWeek", "lastWeek", "thisMonth", "lastMonth"] as const;

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
 * チャレンジセッション1件分のデータ
 * チャレンジセッション
 */
export interface ChallengeSession {
  readonly id: string;
  readonly menuType: PracticeMenuType;
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
 * セッション履歴テーブルの1行
 * セッション履歴行
 */
export interface SessionRow {
  readonly date: string;
  readonly correctAnswers: string;
  readonly incorrectAnswers: number;
}
