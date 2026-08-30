import { randomBool, randomChoice } from "../../core/random";
import { DEFAULT_YAKU_HAN_RANGE, getYakuHanEntries } from "./constants";
import type { YakuHanRange } from "./constants";
import type { YakuHanQuestion } from "./types";

/**
 * 役翻数問題を1問生成する
 * 役翻数問題生成
 *
 * 指定した出題範囲（range）の役からランダムに選び、その役が鳴ける場合は
 * 門前/鳴きをランダムに出題する。門前限定役（nakiHan が undefined）は常に門前で出題する。
 */
export function generateYakuHanQuestion(
  range: YakuHanRange = DEFAULT_YAKU_HAN_RANGE,
): YakuHanQuestion {
  const entry = randomChoice(getYakuHanEntries(range));
  const nakiHan = entry.nakiHan;
  // 鳴ける役のみ 50% で鳴き状態を出題する（門前限定役は常に門前）
  const playNaki = nakiHan !== undefined && randomBool(0.5);

  return {
    yakuName: entry.name,
    isMenzen: !playNaki,
    correctHan: playNaki ? nakiHan : entry.menzenHan,
  };
}
