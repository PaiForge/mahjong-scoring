import type { Payment, ScoreQuestion, UserAnswer } from "@mahjong-scoring/core";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";

/**
 * ScoreQuestion の Payment を ScoreTableAnswer に変換するアダプタ
 * 支払い情報変換
 *
 * @param payment - riichi-mahjong の Payment 型
 * @returns ScoreTableAnswer 形式の正解データ
 */
export function paymentToScoreTableAnswer(
  payment: Readonly<Payment>,
): ScoreTableAnswer {
  switch (payment.type) {
    case "ron":
      return { type: "ron", score: payment.amount };
    case "oyaTsumo":
      return { type: "oyaTsumo", all: payment.amount };
    case "koTsumo":
      return {
        type: "koTsumo",
        fromKo: payment.amount[0],
        fromOya: payment.amount[1],
      };
  }
}

/** 正解の点数を回答欄の形式へ変換する。役の選択は含めない。 */
export function scoreAnswerToUserAnswer(
  answer: ScoreQuestion["answer"],
): UserAnswer {
  const { han, fu, payment } = answer;
  const yakus: readonly string[] = [];
  const base = { han, fu, yakus };
  if (payment.type === "koTsumo") {
    return {
      ...base,
      scoreFromKo: payment.amount[0],
      scoreFromOya: payment.amount[1],
    };
  }
  return { ...base, score: payment.amount };
}
