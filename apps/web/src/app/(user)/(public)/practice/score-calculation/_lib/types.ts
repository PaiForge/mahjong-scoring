import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@mahjong-scoring/features/practice-menu-types";

export type { ScoreQuestionResult as ScoreCalculationQuestionResult } from "@mahjong-scoring/features/results/score-question-result";
export { parseQuestionResults } from "@mahjong-scoring/features/results/score-question-result";
export { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(
  PRACTICE_SLUG.scoreCalculation,
);
