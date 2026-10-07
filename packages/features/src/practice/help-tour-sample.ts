import type { JudgementResult } from "@mahjong-scoring/core";

/**
 * ヘルプツアーの結果スライドで見せる「全問正解」の判定
 * ヘルプツアーの正解判定
 */
export const HELP_TOUR_ALL_CORRECT: JudgementResult = {
  isCorrect: true,
  isHanCorrect: true,
  isFuCorrect: true,
  isScoreCorrect: true,
  isYakuCorrect: true,
};
