import type { ScoreResult, Payment } from "@pai-forge/riichi-mahjong";
import {
  calculateBasePoints,
  ceilTo100,
  KIRIAGE_MANGAN_BASE_POINTS,
  MANGAN_BASE_POINTS,
} from "../core/score-calculation";
import { ScoreLevel } from "../core/constants";
import { scoreTierForHan, YAKUMAN_HAN } from "./tiers";

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
    // 翻数の増減（リーチ・役牌補正）で成立している役満役は変わらないため、
    // 役満単位は元の結果から引き継ぐ。役満手の最終的な点数区分・支払いは
    // alignYakumanScore がこの値から組み直す
    yakumanMultiplier: originalResult.yakumanMultiplier,
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
 * 役満手の点数区分と支払いを役満単位に揃える
 * 役満点数整合
 *
 * リーチ・役牌照合の後付け翻で {@link recalculateScore} を通った結果は、
 * 翻数由来の区分（`scoreTierForHan`）で支払いが組まれており、役満手では
 * ルール設定と食い違いうる。例:
 *
 * - 複合役満（字一色13+大三元13=26翻）に役牌補正が乗ると翻数だけで
 *   ダブル役満の支払いになるが、複合の合算が無効なら役満1つ分が正しい
 * - 役満役なしで26翻以上に達した手（数え）はダブル役満にならない
 *
 * 支払いが役満何個分か（{@link ScoreResult.yakumanMultiplier}）はライブラリが
 * ルール設定込みで確定させた値なので、役満役を含む手はこの値から支払いを
 * 組み直し、数え役満は役満の支払いに丸める。翻・符・役の内訳は変えない
 * （内訳は事実のまま残す。切り上げ満貫の適用と同じ形）。
 */
export function alignYakumanScore(
  result: Readonly<ScoreResult>,
  config: {
    readonly isTsumo: boolean;
    readonly isOya: boolean;
  },
): ScoreResult {
  const yakuman = scoreTierForHan(YAKUMAN_HAN);
  if (!yakuman) return result;

  // 役満役あり: 支払いは役満単位で固定（後付けの翻に左右されない）
  if (result.yakumanMultiplier >= 1) {
    const tier = scoreTierForHan(YAKUMAN_HAN * result.yakumanMultiplier);
    return {
      ...result,
      scoreLevel: tier?.level ?? yakuman.level,
      payment: buildPayment(
        yakuman.basePoints * result.yakumanMultiplier,
        config,
      ),
    };
  }

  // 役満役なし（数え）: 翻数が26以上に達しても役満止まり
  if (result.scoreLevel !== ScoreLevel.DoubleYakuman) return result;
  return {
    ...result,
    scoreLevel: yakuman.level,
    payment: buildPayment(yakuman.basePoints, config),
  };
}

/**
 * 切り上げ満貫で点数が変わる結果かどうかを判定する
 * 切り上げ満貫対象判定
 *
 * 30符4翻・60符3翻（基本符1920）が該当する。標準ルールでは満貫未満だが、
 * 切り上げ満貫ルールでは満貫の点数になる — つまり同じ手牌の正解が採用ルール
 * によって割れる唯一の境界。
 *
 * 適用する側（{@link applyKiriageMangan}）だけでなく、避ける側もこの述語を
 * 使う。出題からこの境界を外したい問題生成（`excludeKiriageBoundary`）が
 * 閾値を再実装すると、片方だけが改訂されて黙ってずれるため。
 */
export function isKiriageManganTarget(result: Readonly<ScoreResult>): boolean {
  if (result.scoreLevel !== ScoreLevel.Normal) return false;
  return (
    calculateBasePoints(result.han, result.fu) >= KIRIAGE_MANGAN_BASE_POINTS
  );
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
  if (!isKiriageManganTarget(result)) return result;
  return {
    ...result,
    scoreLevel: ScoreLevel.Mangan,
    payment: buildPayment(MANGAN_BASE_POINTS, config),
  };
}
