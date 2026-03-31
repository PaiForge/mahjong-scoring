import type { ScoreResult, Payment } from "@pai-forge/riichi-mahjong";

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

  let basePoints = fu * Math.pow(2, 2 + newHanValue);
  let scoreLevel: ScoreResult["scoreLevel"];

  if (newHanValue >= 26) {
    scoreLevel = "DoubleYakuman";
    basePoints = 16000;
  } else if (newHanValue >= 13) {
    scoreLevel = "Yakuman";
    basePoints = 8000;
  } else if (newHanValue >= 11) {
    scoreLevel = "Sanbaiman";
    basePoints = 6000;
  } else if (newHanValue >= 8) {
    scoreLevel = "Baiman";
    basePoints = 4000;
  } else if (newHanValue >= 6) {
    scoreLevel = "Haneman";
    basePoints = 3000;
  } else if (basePoints >= 2000 || newHanValue >= 5) {
    scoreLevel = "Mangan";
    basePoints = 2000;
  } else {
    scoreLevel = "Normal";
  }

  const ceil100 = (n: number) => Math.ceil(n / 100) * 100;

  let payment: Payment;

  if (isTsumo) {
    if (isOya) {
      const amount = ceil100(basePoints * 2);
      payment = { type: "oyaTsumo", amount };
    } else {
      const koPayment = ceil100(basePoints);
      const oyaPayment = ceil100(basePoints * 2);
      payment = { type: "koTsumo", amount: [koPayment, oyaPayment] };
    }
  } else {
    const multiplier = isOya ? 6 : 4;
    const amount = ceil100(basePoints * multiplier);
    payment = { type: "ron", amount };
  }

  return {
    han: newHanValue,
    fu,
    scoreLevel,
    payment,
  };
}
