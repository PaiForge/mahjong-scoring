import { HaiKind } from "@mahjong-scoring/core";
import { createScoreExamHowToPlay } from "../../_lib/create-exam-how-to-play";
import type { ScoreExamHowToPlayConfig } from "../../_lib/create-exam-how-to-play";

/**
 * 昇級試験（平和の点数計算）の「問題方式」ビジュアルデモ
 * 昇級試験 遊び方デモ
 *
 * 実際の出題盤面（手牌・状況のみ。役一覧なし）を静的に再現し、
 * 「翻数は自分で数え、符はツモ20符・ロン30符」という出題形式を端的に示す。
 *
 * 固定例は平和 + 断么九 + 門前清自摸和 = 3翻20符。共通のデモ牌姿がそのまま
 * 平和の教科書的な形（順子4つ + 中張牌の雀頭 + 両面待ち）なので流用する。
 * ドラ表示牌を一索にして手牌に乗らないようにしている（乗せると翻数が上がり、
 * 満貫未満という出題条件から外れやすい）。
 */
export const PINFU_EXAM_DEMO = {
  translationNamespace: "pinfuExamChallenge",
  doraMarkers: [HaiKind.SouZu1],
  isRiichi: false,
} satisfies ScoreExamHowToPlayConfig;

export const PinfuExamHowToPlay = createScoreExamHowToPlay(PINFU_EXAM_DEMO);
