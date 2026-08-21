import {
  haiIdToMspz,
  kazeIdToMspz,
  tehaiToMspz,
  type FuDetail,
  type TotalFuQuestion,
} from "@mahjong-scoring/core";

import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("total-fu");

/**
 * 合計符練習の1問ごとの結果データ
 * 合計符問題結果
 *
 * 結果ページで手牌を再表示するため、出題そのものを MSPZ 文字列として持つ。
 * sessionStorage を経由する都合上、ブランド型（Tehai14 等）はそのまま
 * 往復できないため、牌はすべて文字列に落として保存する。
 */
export interface TotalFuQuestionResult {
  /** 手牌（Extended MSPZ。副露・暗槓を含む） */
  readonly tehai: string;
  /** 和了牌（MSPZ） */
  readonly agariHai: string;
  /** 場風（MSPZ） */
  readonly bakaze: string;
  /** 自風（MSPZ） */
  readonly jikaze: string;
  readonly isTsumo: boolean;
  /** 正解の符（切り上げ後） */
  readonly correctFu: number;
  /** ユーザーが選んだ符 */
  readonly userFu: number;
  readonly isCorrect: boolean;
  /** 切り上げ前の符の内訳 */
  readonly fuDetails: readonly FuDetail[];
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 合計符問題結果生成
 */
export function toQuestionResult(
  question: TotalFuQuestion,
  userFu: number,
): TotalFuQuestionResult {
  const { context } = question;
  return {
    tehai: tehaiToMspz(question.tehai),
    agariHai: haiIdToMspz(context.agariHai),
    bakaze: kazeIdToMspz(context.bakaze),
    jikaze: kazeIdToMspz(context.jikaze),
    isTsumo: context.isTsumo,
    correctFu: question.answer,
    userFu,
    isCorrect: userFu === question.answer,
    fuDetails: question.fuDetails,
  };
}

/** 値が FuDetail の配列として妥当か検証する */
function isValidFuDetails(value: unknown): value is readonly FuDetail[] {
  if (!Array.isArray(value)) return false;
  return value.every((detail: unknown) => {
    if (typeof detail !== "object" || detail === undefined || detail === null)
      return false;
    return (
      typeof Reflect.get(detail, "reason") === "string" &&
      typeof Reflect.get(detail, "fu") === "number"
    );
  });
}

/**
 * sessionStorage から取得した値が TotalFuQuestionResult として妥当か検証する
 * 合計符問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is TotalFuQuestionResult {
  if (typeof value !== "object" || value === undefined || value === null)
    return false;
  const stringFields = ["tehai", "agariHai", "bakaze", "jikaze"];
  if (
    !stringFields.every((key) => typeof Reflect.get(value, key) === "string")
  ) {
    return false;
  }
  return (
    typeof Reflect.get(value, "isTsumo") === "boolean" &&
    typeof Reflect.get(value, "correctFu") === "number" &&
    typeof Reflect.get(value, "userFu") === "number" &&
    typeof Reflect.get(value, "isCorrect") === "boolean" &&
    isValidFuDetails(Reflect.get(value, "fuDetails"))
  );
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 合計符問題結果パース
 */
export const parseTotalFuResults: (
  raw: string | undefined,
) => readonly TotalFuQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);
