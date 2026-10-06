import { HaiKind } from "@mahjong-scoring/core";

import { buildDemoScoreQuestion } from "../../board/demo-score-question";

/**
 * 満貫以上の点数計算の遊び方デモの出題
 * 満貫以上点数計算デモ出題
 *
 * 固定例: 立直 + 門前清自摸和 + 断么九 + 平和 + ドラ1 = 5翻（満貫）。
 * 役と翻数が提示され、そこから点数を導く出題形式を示すため、ドラは手牌に乗る
 * 二萬（表示牌は一萬）にして5翻に届かせる。裏ドラ表示牌は出題と同じくリーチの
 * 手なので添えるが、手牌に乗らない一筒（表示牌は九筒）にして翻数を変えない。
 * web とモバイルのデモで共有する。
 */
export const MANGAN_SCORE_CALCULATION_DEMO_QUESTION = buildDemoScoreQuestion({
  doraMarkers: [HaiKind.ManZu1],
  uraDoraMarkers: [HaiKind.PinZu9],
  isRiichi: true,
  yakuDetails: [
    { name: "立直", han: 1 },
    { name: "門前清自摸和", han: 1 },
    { name: "断么九", han: 1 },
    { name: "平和", han: 1 },
    { name: "ドラ", han: 1 },
  ],
});
