import type { YakuHanQuestion } from "@mahjong-scoring/core";

import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

import { z } from "zod";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";
import {
  answerOutcomeSchema,
  toAnswerOutcome,
  type AnswerOutcome,
} from "../../_lib/result-schemas";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.yakuHan);

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
  /** ユーザーが選択した翻数。時間切れで答えられなかった問題では持たない */
  readonly userHan?: number;
  /** 正解・不正解・時間切れ */
  readonly outcome: AnswerOutcome;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 役翻数問題結果生成
 *
 * @param userHan - ユーザーが選んだ翻数。時間切れで答えられなかった問題は undefined
 */
export function toQuestionResult(
  question: YakuHanQuestion,
  userHan: number | undefined,
): YakuHanQuestionResult {
  return {
    yakuName: question.yakuName,
    isMenzen: question.isMenzen,
    correctHan: question.correctHan,
    userHan,
    outcome: toAnswerOutcome(
      userHan === undefined ? undefined : userHan === question.correctHan,
    ),
  };
}

/**
 * sessionStorage から取得した値が YakuHanQuestionResult として妥当か検証する
 * 役翻数問題結果バリデーション
 */
const questionResultSchema: z.ZodType<YakuHanQuestionResult> = z.object({
  yakuName: z.string(),
  isMenzen: z.boolean(),
  correctHan: z.number(),
  userHan: z.number().optional(),
  outcome: answerOutcomeSchema,
});

/**
 * sessionStorage から問題結果を安全にパースする
 * 役翻数問題結果パース
 */
export const parseYakuHanResults: (
  raw: string | undefined,
) => readonly YakuHanQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
