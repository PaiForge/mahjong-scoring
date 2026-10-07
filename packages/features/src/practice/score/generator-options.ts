import type {
  QuestionGeneratorOptions,
  ScoreRange,
} from "@mahjong-scoring/core";

import {
  HAND_SHAPE_FURO,
  HAND_SHAPE_MENZEN,
  type HandShape,
} from "./hand-shape-param";

/** 点数の無限訓練（score / machi-score）が出題条件として組むオプション */
export type ScoreGeneratorOptions = Pick<
  QuestionGeneratorOptions,
  | "allowedRanges"
  | "includeParent"
  | "includeChild"
  | "requiredYaku"
  | "includeFuro"
  | "requireFuro"
>;

/** 出題条件の元になる絞り込み（web は URL、モバイルは設定ストアから読む） */
export interface ScoreGeneratorConditions {
  /** 満貫未満を出す */
  readonly includeNonMangan: boolean;
  /** 満貫以上を出す */
  readonly includeManganPlus: boolean;
  /** 親の和了を出す */
  readonly includeParent: boolean;
  /** 子の和了を出す */
  readonly includeChild: boolean;
  /** 出題する役（OR）。空なら絞り込みなし */
  readonly requiredYaku: readonly string[];
  /** 手の形の絞り込み。undefined は門前・副露の両方 */
  readonly handShape: HandShape;
}

/**
 * 絞り込みから問題生成オプションを組む
 * 出題条件組み立て
 *
 * 絞り込みが無い軸も、キーを省かず既定値を明示的に入れる。出題条件のストアの
 * `setOptions` はマージなので、キーを省くと前回の絞り込み（役・手の形）が残る。
 */
export function buildScoreGeneratorOptions(
  conditions: ScoreGeneratorConditions,
): ScoreGeneratorOptions {
  const allowedRanges: ScoreRange[] = [];
  if (conditions.includeNonMangan) allowedRanges.push("nonMangan");
  if (conditions.includeManganPlus) allowedRanges.push("manganPlus");

  return {
    allowedRanges,
    includeParent: conditions.includeParent,
    includeChild: conditions.includeChild,
    includeFuro: conditions.handShape !== HAND_SHAPE_MENZEN,
    requireFuro: conditions.handShape === HAND_SHAPE_FURO,
    requiredYaku:
      conditions.requiredYaku.length > 0 ? conditions.requiredYaku : undefined,
  };
}

/** 点数の無限訓練の判定モード（web とモバイルに共通の部分） */
export interface ScorePracticeModeFlags {
  /** 役の回答を必須にする */
  readonly requireYaku: boolean;
  /** 満貫以上の翻数を区分名で答える */
  readonly simplifyMangan: boolean;
  /** 満貫以上でも符の回答を必須にする */
  readonly requireFuForMangan: boolean;
}
