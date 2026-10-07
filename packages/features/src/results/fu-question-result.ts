import type { QuestionTilesSnapshot } from "./parse-question-tiles";
import {
  haiIdToMpsz,
  formatMpsz,
  type FuDetail,
  type RuleConfig,
  type TotalFuQuestion,
} from "@mahjong-scoring/core";

import { z } from "zod";

import { createSessionStorageParser } from "./create-session-storage-parser";
import {
  questionTilesSnapshotSchema,
  fuAnswerResultSchema,
  fuDetailSchema,
  ruleConfigSchema,
  toAnswerOutcome,
  type FuAnswerResult,
} from "./result-schemas";

/**
 * 手牌の合計符を答える出題の1問ごとの結果データ
 * 合計符問題結果
 *
 * 結果ページで手牌を再表示するため、出題そのものを MPSZ 文字列として持つ。
 * sessionStorage を経由する都合上、ブランド型（Tehai14 等）はそのまま
 * 往復できないため、牌はすべて文字列に落として保存する。
 *
 * 合計符を答える出題は複数ある（練習の `total-fu` と4級の昇級試験）ため、
 * 結果の形・組み立て・パースは練習ごとに持たず、点数系の
 * {@link ./score-question-result} と同じくここに一本化する。
 */
export interface FuQuestionResult
  extends FuAnswerResult, QuestionTilesSnapshot {
  readonly isTsumo: boolean;
  /** 切り上げ前の符の内訳 */
  readonly fuDetails: readonly FuDetail[];
  /**
   * 採点に使ったルール設定（連風牌の雀頭符）。結果ページの面子分解で
   * 候補を正解と同じ設定で評価するために持つ。保存を始める前の旧データには無い
   */
  readonly ruleConfig?: RuleConfig;
}

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 合計符問題結果生成
 *
 * @param userFu - ユーザーが選んだ符。時間切れで答えられなかった問題は undefined
 */
export function toFuQuestionResult(
  question: TotalFuQuestion,
  userFu: number | undefined,
): FuQuestionResult {
  const { context } = question;
  return {
    tehai: formatMpsz(question.tehai),
    agariHai: haiIdToMpsz(context.agariHai),
    bakaze: haiIdToMpsz(context.bakaze),
    jikaze: haiIdToMpsz(context.jikaze),
    isTsumo: context.isTsumo,
    correctFu: question.answer,
    userFu,
    outcome: toAnswerOutcome(
      userFu === undefined ? undefined : userFu === question.answer,
    ),
    fuDetails: question.fuDetails,
    ruleConfig: context.ruleConfig,
  };
}

/**
 * sessionStorage から取得した値が FuQuestionResult として妥当か検証する
 * 合計符問題結果バリデーション
 */
const questionResultSchema: z.ZodType<FuQuestionResult> =
  fuAnswerResultSchema.extend({
    ...questionTilesSnapshotSchema.shape,
    isTsumo: z.boolean(),
    fuDetails: z.array(fuDetailSchema),
    ruleConfig: ruleConfigSchema.optional(),
  });

/**
 * sessionStorage から問題結果を安全にパースする
 * 合計符問題結果パース
 */
export const parseFuQuestionResults: (
  stored: unknown,
) => readonly FuQuestionResult[] =
  createSessionStorageParser(questionResultSchema);
