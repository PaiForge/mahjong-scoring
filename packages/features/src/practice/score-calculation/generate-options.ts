import type {
  QuestionGeneratorOptions,
  YakumanRuleConfig,
} from "@mahjong-scoring/core";

import { ruleBoundaryExclusions } from "../../challenge/rule-boundary";

/** 点数計算（点数即答）の出題が読む端末のルール設定 */
export interface ScoreCalculationRuleSettings {
  readonly renfonpaiAs4Fu: boolean;
  readonly kiriageMangan: boolean;
  readonly yakumanRules: YakumanRuleConfig;
}

/**
 * 点数計算（点数即答）の出題オプション
 * 点数計算出題条件
 *
 * 点数の範囲を絞らず、端末のルール設定（連風牌4符・切り上げ満貫・役満の
 * 形）どおりに出題する。チャレンジ（記録あり）では、ルール設定の採否で
 * 正解が割れる手を出題から落とす（{@link ruleBoundaryExclusions}）。
 * web とアプリの盤面が同じ条件で出題するために features に置く。
 *
 * @param isTraining - トレーニングなら境界の手も出す
 */
export function scoreCalculationGenerateOptions(
  rules: ScoreCalculationRuleSettings,
  isTraining: boolean,
): QuestionGeneratorOptions {
  return {
    renfonpaiAs4Fu: rules.renfonpaiAs4Fu,
    kiriageMangan: rules.kiriageMangan,
    yakumanRules: rules.yakumanRules,
    ...ruleBoundaryExclusions(isTraining),
  };
}

/**
 * 満貫以上の点数計算の出題オプション
 * 満貫以上出題条件
 *
 * 満貫以上だけを出題する。符が点数に効かないので連風牌4符・切り上げ満貫は
 * 読まず、役満の形だけを端末のルール設定から取る。チャレンジでは
 * {@link scoreCalculationGenerateOptions} と同じく境界の手を落とす。
 */
export function manganScoreCalculationGenerateOptions(
  yakumanRules: YakumanRuleConfig,
  isTraining: boolean,
): QuestionGeneratorOptions {
  return {
    allowedRanges: ["manganPlus"],
    yakumanRules,
    ...ruleBoundaryExclusions(isTraining),
  };
}
