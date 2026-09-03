import type { ScoreTableAnswer, ScoreTableUserAnswer } from "./types";

/**
 * 点数表早引き練習の正誤判定を行う
 * 点数表正誤判定
 *
 * 支払い形ごとに突き合わせるフィールドが決まる（ロン・親ツモは1口、子ツモは
 * 「子から / 親から」の2口）という同じ規則を、点数計算練習の judgeScore
 * （`problem/score/judgement.ts`）も持つ。1つに寄せていないのは、あちらが
 * 突き合わせるのが「外部ライブラリの Payment」と「フィールドが省略可能な
 * フラットな回答」で、ここの判別共用体と形が違うため。繋ぐと未回答を表す
 * 番兵の数値が要り、「回答が無い」を型で表している利点を潰す。
 * 突き合わせ方そのものを変えるときは両方を直すこと。
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
      return (
        userAnswer.type === "ron" && userAnswer.score === correctAnswer.score
      );
    case "oyaTsumo":
      return (
        userAnswer.type === "oyaTsumo" && userAnswer.all === correctAnswer.all
      );
    case "koTsumo":
      return (
        userAnswer.type === "koTsumo" &&
        userAnswer.fromKo === correctAnswer.fromKo &&
        userAnswer.fromOya === correctAnswer.fromOya
      );
  }
}
