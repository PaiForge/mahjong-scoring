import { HaiKind } from "@mahjong-scoring/core";

import { buildDemoTehai } from "../board/demo-tehai";
import { exampleChii } from "../board/example-mentsu";

/**
 * 食い平和形の例示の牌姿
 * 食い平和形例示
 *
 * 「鳴いた手の点数計算」のコラムで、積み上げた符が 0 符になる鳴いた手を
 * 実際の手牌で見せる。678m をチーし、手の内は 234m 567p 88s と 34s の
 * 両面待ちで、5s をロンした形。面子はすべて順子・雀頭は数牌・待ちは両面で
 * 積み上げた符が 0 符になり、20 符ではなく 30 符で数える。
 *
 * 役は断么九の 1 翻だけにした（コラムが「鳴いても成立する別の役」の例に
 * 挙げるもの）。雀頭を 88s にしたのは、理牌したときに待ちの 34s と離れて
 * 並び、両面待ちが一目で読めるから。
 */
export const KUIPINFU_EXAMPLE = {
  tehai: buildDemoTehai(
    [
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.PinZu5,
      HaiKind.PinZu6,
      HaiKind.PinZu7,
      HaiKind.SouZu3,
      HaiKind.SouZu4,
      HaiKind.SouZu5,
      HaiKind.SouZu8,
      HaiKind.SouZu8,
    ],
    [exampleChii([HaiKind.ManZu6, HaiKind.ManZu7, HaiKind.ManZu8])],
  ),
  /** ロンした牌 */
  agariHai: HaiKind.SouZu5,
} as const;
