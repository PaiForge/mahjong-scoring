import type { ScoreTableAnswer, ScoreTableUserAnswer } from "./types";

/**
 * 点数表早引き練習の正誤判定を行う
 * 点数表正誤判定
 *
 * @param userAnswer - ユーザーの回答
 * @param correctAnswer - 正解
 * @returns 正解なら true
 */
export function judgeScoreTableAnswer(
  userAnswer: Readonly<ScoreTableUserAnswer>,
  correctAnswer: Readonly<ScoreTableAnswer>,
): boolean {
  if (userAnswer.type !== correctAnswer.type) {
    return false;
  }

  switch (correctAnswer.type) {
    case "ron":
      return userAnswer.type === "ron" && userAnswer.score === correctAnswer.score;
    case "oyaTsumo":
      return (
        userAnswer.type === "oyaTsumo" &&
        userAnswer.scoreAll === correctAnswer.scoreAll
      );
    case "koTsumo":
      return (
        userAnswer.type === "koTsumo" &&
        userAnswer.scoreFromKo === correctAnswer.scoreFromKo &&
        userAnswer.scoreFromOya === correctAnswer.scoreFromOya
      );
  }
}
