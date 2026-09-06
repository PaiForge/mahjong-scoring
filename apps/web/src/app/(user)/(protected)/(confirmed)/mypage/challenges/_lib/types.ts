import type { PracticeMenuType } from "@/lib/db/practice-menu-types";

/**
 * チャレンジダッシュボードの共通型定義
 * マイレコード型
 */

/** 期間選択の有効値 */
const DATE_PERIOD_VALUES = [
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
 * マイレコードの土俵 — 練習種別と出題設定のバリアントの組
 * 記録の土俵
 *
 * 記録は (menuType, leaderboardKey) 単位に積まれ、推移・平均・ベストも
 * 同じ単位で見る。バリアントが違えば難易度が違うため、同じ練習でも
 * 混ぜて平均を取らない。設定を持たない練習の `variant` は `DEFAULT_VARIANT`。
 */
export interface RecordBoard {
  readonly menuType: PracticeMenuType;
  /** 出題設定のバリアント（= `leaderboard_key`） */
  readonly variant: string;
}

/**
 * 土俵を 1 つの文字列キーにする（select の value・Map のキー用）
 * 土俵キー
 */
export function recordBoardKey(board: RecordBoard): string {
  return `${board.menuType}:${board.variant}`;
}

/**
 * チャレンジ1件分のデータ
 * チャレンジ
 */
export interface ChallengeAttempt extends RecordBoard {
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
