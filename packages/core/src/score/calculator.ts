import type { ScoreResult, Payment } from "@pai-forge/riichi-mahjong";
import {
  calculateBasePoints,
  ceilTo100,
  KIRIAGE_MANGAN_BASE_POINTS,
  MANGAN_BASE_POINTS,
} from "../core/score-calculation";
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
  } else if (basePoints >= MANGAN_BASE_POINTS) {
    // 4翻以下でも基本符が満貫相当（60符3翻等）なら満貫に切り上げる
    scoreLevel = ScoreLevel.Mangan;
    basePoints = MANGAN_BASE_POINTS;
  } else {
    scoreLevel = ScoreLevel.Normal;
  }

  return {
    han: newHanValue,
    fu,
    scoreLevel,
    payment: buildPayment(basePoints, { isTsumo, isOya }),
  };
}

/**
 * 基本符からツモ/ロン・親/子に応じた支払いを組み立てる
 * 支払い組み立て
 */
function buildPayment(
  basePoints: number,
  config: {
    readonly isTsumo: boolean;
    readonly isOya: boolean;
  },
): Payment {
  const { isTsumo, isOya } = config;
  if (isTsumo) {
    if (isOya) {
      return { type: "oyaTsumo", amount: ceilTo100(basePoints * 2) };
    }
    return {
      type: "koTsumo",
      amount: [ceilTo100(basePoints), ceilTo100(basePoints * 2)],
    };
  }
  return { type: "ron", amount: ceilTo100(basePoints * (isOya ? 6 : 4)) };
}

/**
 * 切り上げ満貫を適用する
 * 切り上げ満貫適用
 *
 * 30符4翻・60符3翻（基本符1920）の結果を満貫の点数に切り上げる。
 * 対象外の結果はそのまま返す。翻・符は変えず、点数区分と支払いだけを
 * 満貫にする（符計算の学習内容は切り上げ満貫でも変わらないため）。
 */
export function applyKiriageMangan(
  result: Readonly<ScoreResult>,
  config: {
    readonly isTsumo: boolean;
    readonly isOya: boolean;
  },
): ScoreResult {
  if (result.scoreLevel !== ScoreLevel.Normal) return result;
  if (calculateBasePoints(result.han, result.fu) < KIRIAGE_MANGAN_BASE_POINTS)
    return result;
  return {
    ...result,
    scoreLevel: ScoreLevel.Mangan,
    payment: buildPayment(MANGAN_BASE_POINTS, config),
  };
}
