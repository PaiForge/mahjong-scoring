import type { ScoreResult, Payment } from "@pai-forge/riichi-mahjong";
import { calculateBasePoints, ceilTo100 } from "../core/score-calculation";
import { ScoreLevel } from "../core/constants";
import { scoreTierForHan } from "./tiers";

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

  const tier = scoreTierForHan(newHanValue);
  if (tier) {
    scoreLevel = tier.level;
    basePoints = tier.basePoints;
  } else if (basePoints >= 2000) {
    // 4翻以下でも基本符が満貫相当（60符3翻等）なら満貫に切り上げる
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
