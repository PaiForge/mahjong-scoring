import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@mahjong-scoring/features/practice-menu-types";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.totalFu);

export type { FuQuestionResult as TotalFuQuestionResult } from "@mahjong-scoring/features/results/fu-question-result";
export { parseFuQuestionResults } from "@mahjong-scoring/features/results/fu-question-result";
