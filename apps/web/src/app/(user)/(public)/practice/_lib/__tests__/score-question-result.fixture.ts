import type { ScoreQuestionResult } from "../score-question-result";

/**
 * 点数系練習の問題結果を組み立てる
 * 結果フィクスチャ
 *
 * 既定は「子・ロン・1翻30符・正解」。検証したい軸だけ overrides で上書きする。
 */
export function makeScoreQuestionResult(
  overrides: Partial<ScoreQuestionResult> = {},
): ScoreQuestionResult {
  return {
    isOya: false,
    isTsumo: false,
    han: 1,
    fu: 30,
    correctAnswer: { type: "ron", score: 1000 },
    userAnswer: { type: "ron", score: 1000 },
    isCorrect: true,
    ...overrides,
  };
}
