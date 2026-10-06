import { HaiKind } from "@mahjong-scoring/core";

import {
  DEMO_YAKUHAI_KOUTSU_HAND,
  type DemoScoreQuestionOptions,
} from "../../board/demo-score-question";

/**
 * 昇段試験（あらゆる手の点数計算）の遊び方デモの出題条件
 * 昇段試験 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況のみ。役一覧なし）を静的に再現し、
 * 「符も翻数も自分で出す」という出題形式を端的に示す。
 *
 * 固定例は役牌（發）= 1翻40符（副底20 + 發の暗刻8 + 門前ロン10 = 38符）で、
 * 1級の試験と同じ牌姿を使う。この試験の違いは出題の広さであって盤面では
 * なく、「どんな手でも出る」ことは静止した1例では見せられない（文言が
 * 受け持つ）。web とモバイルのデモで共有する。
 */
export const SCORE_EXAM_DEMO_OPTIONS = {
  hand: DEMO_YAKUHAI_KOUTSU_HAND,
  doraMarkers: [HaiKind.SouZu1],
  isRiichi: false,
} satisfies DemoScoreQuestionOptions;
