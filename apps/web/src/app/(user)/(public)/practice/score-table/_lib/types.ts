import type { ScoreTableAnswer, ScoreTableUserAnswer } from "@mahjong-scoring/core";

/**
 * 1問ごとの結果データ
 * 点数表問題結果
 */
export interface ScoreTableQuestionResult {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
  /** 符 */
  readonly fu: number;
  /** 正解 */
  readonly correctAnswer: ScoreTableAnswer;
  /** ユーザーの回答 */
  readonly userAnswer: ScoreTableUserAnswer;
  /** 正誤 */
  readonly isCorrect: boolean;
}

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = "score-table-drill-results";

const VALID_ANSWER_TYPES = new Set(["ron", "oyaTsumo", "koTsumo"]);

/**
 * sessionStorage から取得した値が ScoreTableQuestionResult の配列として妥当か検証する
 * 問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is ScoreTableQuestionResult {
  if (typeof value !== "object" || value === undefined) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.isOya === "boolean" &&
    typeof obj.isTsumo === "boolean" &&
    typeof obj.han === "number" &&
    typeof obj.fu === "number" &&
    typeof obj.isCorrect === "boolean" &&
    typeof obj.correctAnswer === "object" &&
    obj.correctAnswer !== undefined &&
    VALID_ANSWER_TYPES.has((obj.correctAnswer as Record<string, unknown>).type as string) &&
    typeof obj.userAnswer === "object" &&
    obj.userAnswer !== undefined &&
    VALID_ANSWER_TYPES.has((obj.userAnswer as Record<string, unknown>).type as string)
  );
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 問題結果パース
 *
 * @param raw - sessionStorage から取得した生文字列
 * @returns パース成功時は結果配列、失敗時は空配列
 */
export function parseQuestionResults(raw: string | undefined): readonly ScoreTableQuestionResult[] {
  if (raw === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidQuestionResult);
  } catch {
    return [];
  }
}
