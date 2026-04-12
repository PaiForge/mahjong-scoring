import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = "han-count-results";

/**
 * 翻数即答ドリルの1問ごとの結果データ
 * 翻数問題結果
 */
export interface HanCountQuestionResult {
  /** 正解の翻数 */
  readonly correctHan: number;
  /** ユーザーが選択した翻数 */
  readonly userHan: number;
  /** 正誤 */
  readonly isCorrect: boolean;
}

/**
 * sessionStorage から取得した値が HanCountQuestionResult として妥当か検証する
 * 翻数問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is HanCountQuestionResult {
  if (typeof value !== "object" || value === undefined || value === null) return false;
  const correctHan = Reflect.get(value, "correctHan");
  const userHan = Reflect.get(value, "userHan");
  const isCorrect = Reflect.get(value, "isCorrect");
  return (
    typeof correctHan === "number" &&
    typeof userHan === "number" &&
    typeof isCorrect === "boolean"
  );
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 翻数問題結果パース
 */
export const parseHanCountResults: (raw: string | undefined) => readonly HanCountQuestionResult[] =
  createSessionStorageParser(isValidQuestionResult);
