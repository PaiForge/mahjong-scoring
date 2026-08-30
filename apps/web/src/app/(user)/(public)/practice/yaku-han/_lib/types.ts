import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";
import { hasFieldTypes } from "../../_lib/shape-guards";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("yaku-han");

/**
 * 役翻数練習の1問ごとの結果データ
 * 役翻数問題結果
 */
export interface YakuHanQuestionResult {
  /** 出題した役名 */
  readonly yakuName: string;
  /** 門前で出題されたか（false は鳴き） */
  readonly isMenzen: boolean;
  /** 正解の翻数 */
  readonly correctHan: number;
  /** ユーザーが選択した翻数 */
  readonly userHan: number;
  /** 正誤 */
  readonly isCorrect: boolean;
}

/**
 * sessionStorage から取得した値が YakuHanQuestionResult として妥当か検証する
 * 役翻数問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is YakuHanQuestionResult {
  return hasFieldTypes(value, {
    yakuName: "string",
    isMenzen: "boolean",
    correctHan: "number",
    userHan: "number",
    isCorrect: "boolean",
  });
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 役翻数問題結果パース
 */
export const parseYakuHanResults: (
  raw: string | undefined,
) => readonly YakuHanQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);
