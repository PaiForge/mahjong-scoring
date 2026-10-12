import type { Fu } from "@pai-forge/riichi-mahjong";
import { FU_VALUES } from "../../score/constants";
import { randomBool, type RandomSource } from "../../core/random";

/**
 * 合計符の出題範囲（正解の符の上限で区切る累積の範囲）
 * 合計符出題範囲
 *
 * 帯は答えの符の上限だけで区切り、下限は持たない。「50符だけ」「60符だけ」の
 * ような帯は答えが範囲から割れてしまい（問題を見なくても正解できる）、練習に
 * ならないため。上限で区切れば、どの範囲でも正解の候補が複数残る。
 *
 * - `up-to-40` — 平和ツモ 20・七対子 25・30・40。実戦の和了の大半で、
 *   30符か 40符かの見分け（4翻で満貫に届くか）が身に付けたいこと
 * - `up-to-60` — 上に、么九牌の暗刻・槓が重なる 50・60 を足す
 * - `all` — 70〜110符まで。実戦ではまれなので、ここにだけ含める
 */
export type TotalFuRange = "up-to-40" | "up-to-60" | "all";

/** 正解の符の帯（両端を含む） */
export interface TotalFuBand {
  readonly min: Fu;
  readonly max: Fu;
}

/** 範囲ごとの正解の符の上限 */
const RANGE_MAX_FU: Readonly<Record<TotalFuRange, Fu>> = {
  "up-to-40": 40,
  "up-to-60": 60,
  all: 110,
};

/**
 * `up-to-60` で 50・60符の帯から出題する確率
 *
 * 手をそのまま作って範囲外を捨てるだけだと、50・60符は 60符以下の正解の
 * 2 割弱にとどまり（自然な出現率は 50符 11%・60符 5%）、40符までの範囲と
 * ほとんど変わらない練習になる。範囲を広げた意味が出るよう、問題の半分を
 * 50・60符に寄せる。
 */
const UP_TO_60_HIGH_BAND_RATE = 0.5;

/**
 * その範囲で正解になりうる符（回答の選択肢）
 * 合計符選択肢
 *
 * 範囲の外の符は正解になり得ないので、選択肢にも出さない。
 */
export function totalFuChoices(range: TotalFuRange): readonly Fu[] {
  return FU_VALUES.filter((fu) => fu <= RANGE_MAX_FU[range]);
}

/**
 * 1 問ぶんの正解の符の帯を選ぶ
 * 合計符帯選択
 *
 * 帯は 1 問ごとに 1 回だけ選び、生成のリトライの間は固定する。リトライの
 * たびに選び直すと、成立しやすい帯（40符以下）に寄っていき、狙った比率に
 * ならない。
 */
export function pickTotalFuBand(
  range: TotalFuRange,
  rng: RandomSource,
): TotalFuBand {
  if (range === "up-to-60") {
    return randomBool(UP_TO_60_HIGH_BAND_RATE, rng)
      ? { min: 50, max: 60 }
      : { min: 20, max: 40 };
  }
  return { min: 20, max: RANGE_MAX_FU[range] };
}
