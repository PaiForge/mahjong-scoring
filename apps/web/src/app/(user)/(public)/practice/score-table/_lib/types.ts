import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

export type { ScoreQuestionResult as ScoreTableQuestionResult } from "../../_lib/score-question-result";
export { parseQuestionResults } from "../../_lib/score-question-result";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.scoreTable);
