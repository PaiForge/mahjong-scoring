import { HaiKind, type Kazehai } from "@pai-forge/riichi-mahjong";
import { BAKAZE_OPTIONS, KAZEHAI } from "../../core/constants";
import { randomChoice, type RandomSource } from "../../core/random";

/**
 * 出題する自風を選択する
 * 自風選択
 *
 * 親（東）と子（南西北）のどちらを出すかを絞れる。両方落とすと候補が無く
 * なるため、その場合は全風から選ぶ。
 */
export function selectJikaze(
  includeParent: boolean,
  includeChild: boolean,
  rng: RandomSource,
): Kazehai {
  let candidates: readonly Kazehai[] = KAZEHAI;
  if (!includeParent) candidates = candidates.filter((k) => k !== HaiKind.Ton);
  if (!includeChild) candidates = candidates.filter((k) => k === HaiKind.Ton);
  if (candidates.length === 0) candidates = KAZEHAI;
  return randomChoice(candidates, rng);
}

/**
 * 出題する場風を選択する
 * 場風選択
 *
 * `excludeRenfonpai` が立つと自風と同じ風を落とし、連風牌（場風＝自風）が
 * 成立しない局面だけを出題する（理由は `QuestionGeneratorOptions` の
 * `excludeRenfonpai` に書いてある）。
 *
 * 合計符の出題（`generateTotalFuQuestion`）は逆に場風を先に決めて自風を
 * 落とすが、点数の出題では向きを変えている。あちらの向きだと自風が場風以外の
 * 3択になり、親（東）が出るのは南場のときだけ — 全体の 1/6 にまで下がる。
 * 点数は親と子で別の表を引くため、親の出題が細るのは出題として困る。
 * 場風は東南の2択しかなく、片方を落としても必ず候補が残る。
 */
export function selectBakaze(
  jikaze: Kazehai,
  excludeRenfonpai: boolean,
  rng: RandomSource,
): Kazehai {
  const candidates = excludeRenfonpai
    ? BAKAZE_OPTIONS.filter((kaze) => kaze !== jikaze)
    : BAKAZE_OPTIONS;
  return randomChoice(candidates, rng);
}
