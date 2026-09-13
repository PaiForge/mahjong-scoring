import { judgeScoreTableAnswer } from "@mahjong-scoring/core";
import type {
  ScoreTableAnswer,
  ScoreTableQuestion,
} from "@mahjong-scoring/core";

import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

import type { ScoreQuestionResult } from "../../_lib/score-question-result";
import { toAnswerOutcome } from "../../_lib/result-schemas";

export type { ScoreQuestionResult as ScoreTableQuestionResult } from "../../_lib/score-question-result";
export { parseQuestionResults } from "../../_lib/score-question-result";

/**
 * 出題と回答から保存用の結果データを組み立てる
 * 点数表問題結果生成
 *
 * 点数系の共通の結果型に載せるが、出題が手牌を持たないため
 * `question`（手牌の再表示用スナップショット）は付かない。
 *
 * @param userAnswer - ユーザーの回答。時間切れで答えられなかった問題は undefined
 */
export function toQuestionResult(
  question: ScoreTableQuestion,
  userAnswer: ScoreTableAnswer | undefined,
): ScoreQuestionResult {
  return {
    isOya: question.isOya,
    isTsumo: question.isTsumo,
    han: question.han,
    fu: question.fu,
    correctAnswer: question.correctAnswer,
    userAnswer,
    outcome: toAnswerOutcome(
      userAnswer && judgeScoreTableAnswer(userAnswer, question.correctAnswer),
    ),
  };
}

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.scoreTable);
