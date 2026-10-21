import {
  randomFloat,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";

/**
 * 面子種別の確率重み
 * 面子生成重み
 */
export interface MentsuWeights {
  /** 順子の確率（0〜1） */
  readonly shuntsu: number;
  /** 刻子の確率（0〜1、残りが槓子） */
  readonly koutsu: number;
}

/** 面子の種別 */
export type MentsuKind = "shuntsu" | "koutsu" | "kantsu";

/**
 * 重みに従って面子の種別をランダムに選ぶ
 * 面子種別抽選
 *
 * 選んだ種別が牌の残数不足で作れなかったときのフォールバック先は
 * 呼び出し側で決める（用途によって優先順位が違うため）。
 *
 * @param weights - 順子・刻子の確率（残りが槓子）
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function pickMentsuType(
  weights: Readonly<MentsuWeights>,
  rng: RandomSource = defaultRandomSource,
): MentsuKind {
  const r = randomFloat(rng);
  if (r < weights.shuntsu) return "shuntsu";
  if (r < weights.shuntsu + weights.koutsu) return "koutsu";
  return "kantsu";
}
