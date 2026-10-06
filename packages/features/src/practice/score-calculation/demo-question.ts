import { HaiKind } from "@mahjong-scoring/core";

import { buildDemoScoreQuestion } from "../../board/demo-score-question";

/**
 * 点数即答の遊び方デモの出題
 * 点数計算デモ出題
 *
 * 固定例: 平和 + 断么九 + 門前清自摸和（子・門前ツモ・両面待ち）。
 * 手牌・状況から点数を読み取る出題形式を示すため、ドラは手牌に乗らない
 * 二索（表示牌は一索）にして翻数を増やさない。web とモバイルのデモで共有する。
 */
export const SCORE_CALCULATION_DEMO_QUESTION = buildDemoScoreQuestion({
  doraMarkers: [HaiKind.SouZu1],
  isRiichi: false,
});
