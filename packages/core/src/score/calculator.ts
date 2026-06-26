import type { ScoreResult, Payment } from "@pai-forge/riichi-mahjong";
import { calculateBasePoints, ceilTo100 } from "../core/score-calculation";
import { ScoreLevel } from "../core/constants";

/**
 * 翻数が変わった場合の点数を再計算する
 * リーチのように「手牌は変わらないが翻数が増える」ケースで使用する
 * 翻数変更時の点数再計算
 *
 * @param originalResult - 元の点数計算結果
 * @param newHanValue - 新しい翻数
 * @param config - ツモ/ロン・親/子の情報
 */
export function recalculateScore(
  originalResult: Readonly<ScoreResult>,
  newHanValue: number,
  config: {
    readonly isTsumo: boolean;
    readonly isOya: boolean;
  },
): ScoreResult {
  const fu = originalResult.fu;
  const { isTsumo, isOya } = config;

  let basePoints = calculateBasePoints(newHanValue, fu);
  let scoreLevel: ScoreResult["scoreLevel"];

  if (newHanValue >= 26) {
    scoreLevel = ScoreLevel.DoubleYakuman;
    basePoints = 16000;
  } else if (newHanValue >= 13) {
    scoreLevel = ScoreLevel.Yakuman;
    basePoints = 8000;
  } else if (newHanValue >= 11) {
    scoreLevel = ScoreLevel.Sanbaiman;
    basePoints = 6000;
  } else if (newHanValue >= 8) {
    scoreLevel = ScoreLevel.Baiman;
    basePoints = 4000;
  } else if (newHanValue >= 6) {
    scoreLevel = ScoreLevel.Haneman;
    basePoints = 3000;
  } else if (basePoints >= 2000 || newHanValue >= 5) {
    scoreLevel = ScoreLevel.Mangan;
    basePoints = 2000;
  } else {
    scoreLevel = ScoreLevel.Normal;
  }

  let payment: Payment;

  if (isTsumo) {
    if (isOya) {
      const amount = ceilTo100(basePoints * 2);
      payment = { type: "oyaTsumo", amount };
    } else {
      const koPayment = ceilTo100(basePoints);
      const oyaPayment = ceilTo100(basePoints * 2);
      payment = { type: "koTsumo", amount: [koPayment, oyaPayment] };
    }
  } else {
    const multiplier = isOya ? 6 : 4;
    const amount = ceilTo100(basePoints * multiplier);
    payment = { type: "ron", amount };
  }

  return {
    han: newHanValue,
    fu,
    scoreLevel,
    payment,
  };
}
