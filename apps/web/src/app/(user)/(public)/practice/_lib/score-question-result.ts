import type { ScoreTableAnswer } from "@mahjong-scoring/core";

import { createSessionStorageParser } from "./create-session-storage-parser";

/**
 * 1問ごとの結果データ（点数系ドリル共通）
 * 点数問題結果
 */
export interface ScoreQuestionResult {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
  /** 符 */
  readonly fu: number;
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
  if (typeof value !== "object" || value === undefined || value === null) return false;
  const typeValue = Reflect.get(value, "type");
  return typeof typeValue === "string" && VALID_ANSWER_TYPES.has(typeValue);
}

/**
 * sessionStorage から取得した値が ScoreQuestionResult として妥当か検証する
 * 問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is ScoreQuestionResult {
  if (typeof value !== "object" || value === undefined || value === null) return false;
  const isOya = Reflect.get(value, "isOya");
  const isTsumo = Reflect.get(value, "isTsumo");
  const han = Reflect.get(value, "han");
  const fu = Reflect.get(value, "fu");
  const isCorrect = Reflect.get(value, "isCorrect");
  const correctAnswer = Reflect.get(value, "correctAnswer");
  const userAnswer = Reflect.get(value, "userAnswer");
  return (
    typeof isOya === "boolean" &&
    typeof isTsumo === "boolean" &&
    typeof han === "number" &&
    typeof fu === "number" &&
    typeof isCorrect === "boolean" &&
    hasValidAnswerType(correctAnswer) &&
    hasValidAnswerType(userAnswer)
  );
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 問題結果パース
 */
export const parseQuestionResults: (raw: string | undefined) => readonly ScoreQuestionResult[] =
  createSessionStorageParser(isValidQuestionResult);
