import { HaiKind } from "@mahjong-scoring/core";
import { DEMO_CHIITOITSU_HAND } from "@/app/(user)/(public)/practice/_lib/demo-score-question";
import { createScoreExamHowToPlay } from "../../_lib/create-exam-how-to-play";

/**
 * 昇級試験（七対子の点数計算）の「問題方式」ビジュアルデモ
 * 昇級試験 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況のみ。役一覧なし）を静的に再現し、
 * 「翻数は自分で数え、符は25符で固定」という出題形式を端的に示す。
 *
 * 固定例は七対子 + ドラ2（二萬）= 4翻25符。ドラ表示牌を一萬にして手牌の
 * 二萬対子をドラに乗せている。
 */
export const ChiitoitsuExamHowToPlay = createScoreExamHowToPlay({
  translationNamespace: "chiitoitsuExamChallenge",
  hand: DEMO_CHIITOITSU_HAND,
  doraMarkers: [HaiKind.ManZu1],
  isRiichi: false,
});
