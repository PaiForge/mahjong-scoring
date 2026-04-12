import type { Payment } from "@mahjong-scoring/core";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";

export type { ScoreQuestionResult as ScoreCalculationQuestionResult } from "../../_lib/score-question-result";
export { parseQuestionResults } from "../../_lib/score-question-result";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = "score-calculation-drill-results";

/**
 * ScoreQuestion の Payment を ScoreTableAnswer に変換するアダプタ
 * 支払い情報変換
 *
 * @param payment - riichi-mahjong の Payment 型
 * @returns ScoreTableAnswer 形式の正解データ
 */
export function paymentToScoreTableAnswer(payment: Readonly<Payment>): ScoreTableAnswer {
  switch (payment.type) {
    case "ron":
      return { type: "ron", score: payment.amount };
    case "oyaTsumo":
      return { type: "oyaTsumo", scoreAll: payment.amount };
    case "koTsumo":
      return { type: "koTsumo", scoreFromKo: payment.amount[0], scoreFromOya: payment.amount[1] };
  }
}
