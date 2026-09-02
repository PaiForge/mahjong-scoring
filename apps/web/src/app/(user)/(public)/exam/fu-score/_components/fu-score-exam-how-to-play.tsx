import { HaiKind } from "@mahjong-scoring/core";
import { DEMO_YAKUHAI_KOUTSU_HAND } from "@/app/(user)/(public)/practice/_lib/demo-score-question";
import { createScoreExamHowToPlay } from "../../_lib/create-exam-how-to-play";

/**
 * 昇級試験（30〜50符の点数計算）の「問題方式」ビジュアルデモ
 * 昇級試験 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況のみ。役一覧なし）を静的に再現し、
 * 「符も翻数も自分で出す」という出題形式を端的に示す。
 *
 * 固定例は役牌（發）= 1翻40符（副底20 + 發の暗刻8 + 門前ロン10 = 38符）。
 * ドラ表示牌を一索にして手牌に乗らないようにしている（乗せると翻数が上がり、
 * 符から点数を出すという主題が霞む）。
 */
export const FuScoreExamHowToPlay = createScoreExamHowToPlay({
  translationNamespace: "fuScoreExamChallenge",
  hand: DEMO_YAKUHAI_KOUTSU_HAND,
  doraMarkers: [HaiKind.SouZu1],
  isRiichi: false,
});
