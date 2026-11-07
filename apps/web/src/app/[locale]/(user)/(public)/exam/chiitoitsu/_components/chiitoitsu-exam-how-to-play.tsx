import { EXAM_BOARD_CONFIG } from "@mahjong-scoring/features/exam/chiitoitsu/types";
import { CHIITOITSU_EXAM_DEMO_OPTIONS } from "@mahjong-scoring/features/exam/chiitoitsu/demo-question";
import { createScoreExamHowToPlay } from "../../_lib/create-exam-how-to-play";
import type { ScoreExamHowToPlayConfig } from "../../_lib/create-exam-how-to-play";

/**
 * 昇級試験（七対子の点数計算）の「問題方式」ビジュアルデモ
 * 昇級試験 遊び方デモ
 *
 * 牌姿と表示牌（とその選び方の理由）はモバイルと共有する
 * `CHIITOITSU_EXAM_DEMO_OPTIONS` が持つ。ここは翻訳名前空間を束ねるだけ。
 */
export const CHIITOITSU_EXAM_DEMO = {
  translationNamespace: EXAM_BOARD_CONFIG.translationNamespace,
  ...CHIITOITSU_EXAM_DEMO_OPTIONS,
} satisfies ScoreExamHowToPlayConfig;

export const ChiitoitsuExamHowToPlay =
  createScoreExamHowToPlay(CHIITOITSU_EXAM_DEMO);
