export type { ScoreQuestionResult as ScoreCalculationQuestionResult } from "../../_lib/score-question-result";
export { parseQuestionResults } from "../../_lib/score-question-result";
export { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = "score-calculation-results";
