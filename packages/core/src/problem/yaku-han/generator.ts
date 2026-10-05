import {
  randomBool,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import {
  canPromptNaki,
  DEFAULT_YAKU_HAN_RANGE,
  getYakuHanEntries,
} from "./constants";
import type { YakuHanRange } from "./constants";
import type { YakuHanQuestion } from "./types";

/**
 * 役翻数問題を1問生成する
 * 役翻数問題生成
 *
 * 指定した出題範囲（range）の役からランダムに選び、鳴き状態で出題してよい役
 * （{@link canPromptNaki}）だけ門前/鳴きをランダムに出題する。それ以外は常に
 * 門前で出題する。
 *
 * @param range - 出題範囲
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateYakuHanQuestion(
  range: YakuHanRange = DEFAULT_YAKU_HAN_RANGE,
  rng: RandomSource = defaultRandomSource,
): YakuHanQuestion {
  const entry = randomChoice(getYakuHanEntries(range), rng);
  const nakiHan = canPromptNaki(entry) ? entry.nakiHan : undefined;
  // 鳴き状態で出題してよい役のみ 50% で鳴きにする（それ以外は常に門前）
  const playNaki = nakiHan !== undefined && randomBool(0.5, rng);

  return {
    yakuName: entry.name,
    isMenzen: !playNaki,
    correctHan: playNaki ? nakiHan : entry.menzenHan,
  };
}
