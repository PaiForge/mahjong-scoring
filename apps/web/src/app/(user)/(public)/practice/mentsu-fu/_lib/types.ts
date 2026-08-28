import type { MentsuFuQuestion } from "@mahjong-scoring/core";

import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";
import {
  isValidSerializedMentsu,
  toSerializedMentsu,
  type SerializedMentsu,
} from "../../_lib/mentsu-serialization";
import { hasFieldTypes } from "../../_lib/shape-guards";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("mentsu-fu");

/**
 * 面子符練習の1問ごとの結果データ
 * 面子符問題結果
 *
 * 結果ページで出題された面子を再表示するため、面子そのものを保存形で持つ。
 * 符は明暗と牌の種類で決まるので、符だけ並べても振り返りにならない。
 */
export interface MentsuFuQuestionResult {
  readonly mentsu: SerializedMentsu;
  /** 正解の符 */
  readonly correctFu: number;
  /** ユーザーが選んだ符 */
  readonly userFu: number;
  readonly isCorrect: boolean;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 面子符問題結果生成
 */
export function toQuestionResult(
  question: MentsuFuQuestion,
  userFu: number,
): MentsuFuQuestionResult {
  return {
    mentsu: toSerializedMentsu(question.mentsu),
    correctFu: question.answer,
    userFu,
    isCorrect: userFu === question.answer,
  };
}

/**
 * sessionStorage から取得した値が MentsuFuQuestionResult として妥当か検証する
 * 面子符問題結果バリデーション
 */
function isValidQuestionResult(
  value: unknown,
): value is MentsuFuQuestionResult {
  if (
    !hasFieldTypes(value, {
      correctFu: "number",
      userFu: "number",
      isCorrect: "boolean",
    })
  ) {
    return false;
  }
  return isValidSerializedMentsu(Reflect.get(value, "mentsu"));
}

/**
 * sessionStorage から問題結果を安全にパースする
 * 面子符問題結果パース
 */
export const parseMentsuFuResults: (
  raw: string | undefined,
) => readonly MentsuFuQuestionResult[] = createSessionStorageParser(
  isValidQuestionResult,
);
