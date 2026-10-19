import { clampHanToYakuman } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";

import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@mahjong-scoring/features/practice-menu-types";

import { z } from "zod";

import { createSessionStorageParser } from "@mahjong-scoring/features/results/create-session-storage-parser";
import {
  hanAnswerResultSchema,
  toAnswerOutcome,
  type HanAnswerResult,
} from "@mahjong-scoring/features/results/result-schemas";
import type { ScoreQuestionSnapshot } from "@mahjong-scoring/features/results/score-question-result";
import {
  scoreQuestionSnapshotSchema,
  toScoreQuestionSnapshot,
} from "@mahjong-scoring/features/results/score-question-result";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.hanCount);

/**
 * 翻数即答練習の出題スナップショット
 * 翻数出題スナップショット
 *
 * 点数系練習と共通の出題スナップショット（{@link ScoreQuestionSnapshot}）に、
 * ツモ・ロンの別を足したもの。この中に置いているのは、点数系と違って結果の
 * 直下に持たないため（翻数の正誤だけでは和了の形が復元できない）。
 * 役の内訳（丸め前の翻数の根拠）は共通のスナップショットが持つ。
 */
export interface HanCountQuestionSnapshot extends ScoreQuestionSnapshot {
  /** ツモ和了かどうか */
  readonly isTsumo: boolean;
}

/**
 * 翻数即答練習の1問ごとの結果データ
 * 翻数問題結果
 */
export interface HanCountQuestionResult extends HanAnswerResult {
  /** 正解の翻数（13翻以上の手は役満=13翻に丸めて記録する） */
  readonly correctHan: number;
  /** 出題内容。結果ページで手牌と役の内訳を再表示するために持つ */
  readonly question: HanCountQuestionSnapshot;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 翻数問題結果生成
 *
 * 13翻以上（役満+ドラ・ダブル役満等）は選択肢に無いため、正解を役満（13翻）に
 * 丸めて判定・記録する。丸め前の翻数は `question.yakuDetails` の合計として
 * 残るので、結果ページでは「合計16翻 → 役満」まで示せる。
 *
 * @param userHan - ユーザーが選んだ翻数。時間切れで答えられなかった問題は undefined
 */
export function toHanCountQuestionResult(
  question: ScoreQuestion,
  userHan: number | undefined,
): HanCountQuestionResult {
  const correctHan = clampHanToYakuman(question.answer.han);
  return {
    correctHan,
    userHan,
    outcome: toAnswerOutcome(
      userHan === undefined ? undefined : userHan === correctHan,
    ),
    question: {
      ...toScoreQuestionSnapshot(question),
      isTsumo: question.isTsumo,
    },
  };
}

/**
 * 値が HanCountQuestionSnapshot として妥当か検証するスキーマ
 * 翻数出題スナップショットスキーマ
 *
 * 点数系共通のスナップショットに、この練習だけが持つツモ・ロンの別を重ねる。
 */
const questionSnapshotSchema: z.ZodType<HanCountQuestionSnapshot> =
  z.intersection(
    scoreQuestionSnapshotSchema,
    z.object({ isTsumo: z.boolean() }),
  );

/**
 * sessionStorage から取得した値が HanCountQuestionResult として妥当か検証する
 * 翻数問題結果バリデーション
 */
const questionResultSchema: z.ZodType<HanCountQuestionResult> =
  hanAnswerResultSchema.extend({ question: questionSnapshotSchema });

/**
 * sessionStorage から問題結果を安全にパースする
 * 翻数問題結果パース
 */
export const parseHanCountResults: (
  stored: unknown,
) => readonly HanCountQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
