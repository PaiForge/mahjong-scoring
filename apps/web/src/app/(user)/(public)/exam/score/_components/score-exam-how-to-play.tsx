import { SCORE_EXAM_DEMO_OPTIONS } from "@mahjong-scoring/features/exam/score/demo-question";
import { createScoreExamHowToPlay } from "../../_lib/create-exam-how-to-play";
import type { ScoreExamHowToPlayConfig } from "../../_lib/create-exam-how-to-play";

/**
 * 昇段試験（あらゆる手の点数計算）の「問題方式」ビジュアルデモ
 * 昇段試験 遊び方デモ
 *
 * 牌姿と表示牌（とその選び方の理由）はモバイルと共有する
 * `SCORE_EXAM_DEMO_OPTIONS` が持つ。ここは翻訳名前空間を束ねるだけ。
 */
export const SCORE_EXAM_DEMO = {
  translationNamespace: "scoreExamChallenge",
  ...SCORE_EXAM_DEMO_OPTIONS,
} satisfies ScoreExamHowToPlayConfig;

export const ScoreExamHowToPlay = createScoreExamHowToPlay(SCORE_EXAM_DEMO);
