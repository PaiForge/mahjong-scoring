import type { LessonQuiz } from "./quiz";
import { buildTierQuiz } from "./tier-quiz";

/**
 * 「親のロン（満貫以上）」レッスンの確認問題
 * 親ロンレッスン確認問題
 *
 * 翻数を示して、親がロンしたときの点数を選ばせる。
 */
export const MANGAN_OYA_RON_LESSON_QUIZ: LessonQuiz = buildTierQuiz((row) => ({
  kind: "points",
  points: row.ronOya,
}));
