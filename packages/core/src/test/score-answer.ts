import type { ScoreQuestion, UserAnswer } from "../problem/score/types";

/** 出題の正解からそのまま作った回答 */
export function correctAnswerOf(cell: ScoreQuestion): UserAnswer {
  const { payment } = cell.answer;
  const base = { han: cell.answer.han, fu: cell.answer.fu, yakus: [] };
  return payment.type === "koTsumo"
    ? {
        ...base,
        scoreFromKo: payment.amount[0],
        scoreFromOya: payment.amount[1],
      }
    : { ...base, score: payment.amount };
}
