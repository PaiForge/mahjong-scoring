import { HaiKind } from "@mahjong-scoring/core";
import { createScoreExamHowToPlay } from "../../_lib/create-exam-how-to-play";

/**
 * 昇級試験（満貫以上の点数計算）の「問題方式」ビジュアルデモ
 * 昇級試験 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況のみ。役一覧なし）を静的に再現し、
 * 「翻数は自分で数える」出題形式を端的に示す。
 *
 * 固定例は立直 + 門前清自摸和 + 断么九 + 平和 + ドラ1 = 5翻（満貫）。
 * 満貫以上ドリルと同じ手牌を使う。裏ドラ表示牌は出題と同じくリーチの手なので
 * 添えるが、手牌に乗らない一筒（表示牌は九筒）にして翻数を変えない。
 */
export const ManganExamHowToPlay = createScoreExamHowToPlay({
  translationNamespace: "manganExamChallenge",
  doraMarkers: [HaiKind.ManZu1],
  uraDoraMarkers: [HaiKind.PinZu9],
  isRiichi: true,
});
