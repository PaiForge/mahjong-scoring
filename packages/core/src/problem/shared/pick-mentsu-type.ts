import { randomFloat } from "../../core/random";
import type { MentsuWeights } from "../mentsu-fu/mentsu-factory";

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
 */
export function pickMentsuType(weights: Readonly<MentsuWeights>): MentsuKind {
  const r = randomFloat();
  if (r < weights.shuntsu) return "shuntsu";
  if (r < weights.shuntsu + weights.koutsu) return "koutsu";
  return "kantsu";
}
