import {
  haiIdToMspz,
  kazeIdToMspz,
  tehaiToMspz,
  type FuDetail,
  type TotalFuQuestion,
} from "@mahjong-scoring/core";

import { createSessionStorageParser } from "./create-session-storage-parser";
import { hasFieldTypes } from "./shape-guards";

/**
 * 手牌の合計符を答える出題の1問ごとの結果データ
 * 合計符問題結果
 *
 * 結果ページで手牌を再表示するため、出題そのものを MSPZ 文字列として持つ。
 * sessionStorage を経由する都合上、ブランド型（Tehai14 等）はそのまま
 * 往復できないため、牌はすべて文字列に落として保存する。
 *
 * 合計符を答える出題は複数ある（練習の `total-fu` と4級の昇級試験）ため、
 * 結果の形・組み立て・パースは練習ごとに持たず、点数系の
 * {@link ./score-question-result} と同じくここに一本化する。
 */
export interface FuQuestionResult {
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
export function toFuQuestionResult(
  question: TotalFuQuestion,
  userFu: number,
): FuQuestionResult {
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
  return value.every((detail: unknown) =>
    hasFieldTypes(detail, { reason: "string", fu: "number" }),
  );
}

/**
 * sessionStorage から取得した値が FuQuestionResult として妥当か検証する
 * 合計符問題結果バリデーション
 */
function isValidQuestionResult(value: unknown): value is FuQuestionResult {
  if (
    !hasFieldTypes(value, {
      tehai: "string",
      agariHai: "string",
      bakaze: "string",
      jikaze: "string",
      isTsumo: "boolean",
      correctFu: "number",
      userFu: "number",
      isCorrect: "boolean",
    })
  ) {
    return false;
  }
  return isValidFuDetails(Reflect.get(value, "fuDetails"));
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 合計符問題結果パース
 */
export const parseFuQuestionResults: (
  raw: string | undefined,
) => readonly FuQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);
