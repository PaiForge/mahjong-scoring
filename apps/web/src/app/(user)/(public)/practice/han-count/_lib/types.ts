import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";
import { hasFieldTypes } from "../../_lib/shape-guards";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("han-count");

/**
 * 翻数即答練習の1問ごとの結果データ
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
function isValidQuestionResult(
  value: unknown,
): value is HanCountQuestionResult {
  return hasFieldTypes(value, {
    correctHan: "number",
    userHan: "number",
    isCorrect: "boolean",
  });
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 翻数問題結果パース
 */
export const parseHanCountResults: (
  raw: string | undefined,
) => readonly HanCountQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);
