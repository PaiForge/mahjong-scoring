import { clampHanToYakuman } from "@mahjong-scoring/core";
import type { ScoreQuestion, YakuDetail } from "@mahjong-scoring/core";

import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

import { z } from "zod";

import { createSessionStorageParser } from "../../_lib/create-session-storage-parser";
import { yakuDetailSchema } from "../../_lib/result-schemas";
import type { ScoreQuestionSnapshot } from "../../_lib/score-question-result";
import {
  scoreQuestionSnapshotSchema,
  toScoreQuestionSnapshot,
} from "../../_lib/score-question-result";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("han-count");

/**
 * 翻数即答練習の出題スナップショット
 * 翻数出題スナップショット
 *
 * 点数系練習と共通の出題スナップショット（{@link ScoreQuestionSnapshot}）に、
 * 手牌の再表示と役の内訳表示に要るぶんを足したもの。ツモ・ロンの別を
 * この中に置いているのは、点数系と違って結果の直下に持たないため
 * （翻数の正誤だけでは和了の形が復元できない）。
 */
export interface HanCountQuestionSnapshot extends ScoreQuestionSnapshot {
  /** ツモ和了かどうか */
  readonly isTsumo: boolean;
  /**
   * 役の内訳（ドラ・裏ドラを含む）
   *
   * 各役の翻数を合計すると丸め前の翻数になる。結果ページで「なぜその翻数に
   * なるのか」を示すために持つ。
   */
  readonly yakuDetails: readonly YakuDetail[];
}

/**
 * 翻数即答練習の1問ごとの結果データ
 * 翻数問題結果
 */
export interface HanCountQuestionResult {
  /** 正解の翻数（13翻以上の手は役満=13翻に丸めて記録する） */
  readonly correctHan: number;
  /** ユーザーが選択した翻数 */
  readonly userHan: number;
  /** 正誤 */
  readonly isCorrect: boolean;
  /**
   * 出題内容。結果ページで手牌と役の内訳を再表示するために持つ。
   * この項目を保存する前の旧データには存在しないため任意
   */
  readonly question?: HanCountQuestionSnapshot;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 翻数問題結果生成
 *
 * 13翻以上（役満+ドラ・ダブル役満等）は選択肢に無いため、正解を役満（13翻）に
 * 丸めて判定・記録する。丸め前の翻数は `question.yakuDetails` の合計として
 * 残るので、結果ページでは「合計16翻 → 役満」まで示せる。
 */
export function toHanCountQuestionResult(
  question: ScoreQuestion,
  userHan: number,
): HanCountQuestionResult {
  const correctHan = clampHanToYakuman(question.answer.han);
  return {
    correctHan,
    userHan,
    isCorrect: userHan === correctHan,
    question: {
      ...toScoreQuestionSnapshot(question),
      isTsumo: question.isTsumo,
      yakuDetails: question.yakuDetails ?? [],
    },
  };
}

/**
 * 値が HanCountQuestionSnapshot として妥当か検証するスキーマ
 * 翻数出題スナップショットスキーマ
 *
 * 点数系共通のスナップショットに、この練習だけが必須にしている 2 つ
 * （ツモ・ロンの別と役の内訳）を重ねる。
 */
const questionSnapshotSchema: z.ZodType<HanCountQuestionSnapshot> =
  z.intersection(
    scoreQuestionSnapshotSchema,
    z.object({
      isTsumo: z.boolean(),
      yakuDetails: z.array(yakuDetailSchema),
    }),
  );

/**
 * sessionStorage から取得した値が HanCountQuestionResult として妥当か検証する
 * 翻数問題結果バリデーション
 *
 * 出題スナップショットは保存を始める前の旧データに存在しないため任意。
 */
const questionResultSchema: z.ZodType<HanCountQuestionResult> = z.object({
  correctHan: z.number(),
  userHan: z.number(),
  isCorrect: z.boolean(),
  question: questionSnapshotSchema.optional(),
});

/**
 * sessionStorage から問題結果を安全にパースする
 * 翻数問題結果パース
 */
export const parseHanCountResults: (
  raw: string | undefined,
) => readonly HanCountQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
