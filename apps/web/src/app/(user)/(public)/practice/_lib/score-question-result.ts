import type { ScoreTableAnswer } from "@mahjong-scoring/core";

import { createSessionStorageParser } from "./create-session-storage-parser";
import { hasFieldTypes, isRecord } from "./shape-guards";

/**
 * 1問ごとの結果データ（点数系練習共通）
 * 点数問題結果
 */
export interface ScoreQuestionResult {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
  /** 符。満貫以上の問題では符に依存しないため省略される */
  readonly fu?: number;
  /** 正解の支払い情報 */
  readonly correctAnswer: ScoreTableAnswer;
  /** ユーザーの回答 */
  readonly userAnswer: ScoreTableAnswer;
  /** 正誤 */
  readonly isCorrect: boolean;
}

const VALID_ANSWER_TYPES = new Set(["ron", "oyaTsumo", "koTsumo"]);

/**
 * 回答オブジェクトの type フィールドが有効かを判定する
 * 回答型判定
 */
function hasValidAnswerType(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const typeValue: unknown = Reflect.get(value, "type");
  return typeof typeValue === "string" && VALID_ANSWER_TYPES.has(typeValue);
}

/**
 * sessionStorage から取得した値が ScoreQuestionResult として妥当か検証する
 * 問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is ScoreQuestionResult {
  if (
    !hasFieldTypes(value, {
      isOya: "boolean",
      isTsumo: "boolean",
      han: "number",
      isCorrect: "boolean",
    })
  ) {
    return false;
  }
  // 符は満貫以上の問題で省略されるため、任意フィールドとして個別に見る
  const fu: unknown = Reflect.get(value, "fu");
  return (
    (fu === undefined || typeof fu === "number") &&
    hasValidAnswerType(Reflect.get(value, "correctAnswer")) &&
    hasValidAnswerType(Reflect.get(value, "userAnswer"))
  );
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 問題結果パース
 */
export const parseQuestionResults: (
  raw: string | undefined,
) => readonly ScoreQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);
