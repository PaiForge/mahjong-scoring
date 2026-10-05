import type { LessonQuiz } from "./quiz";
import { buildTierQuiz } from "./tier-quiz";

/**
 * 「子のロン（満貫以上）」レッスンの確認問題
 * 子ロンレッスン確認問題
 *
 * 翻数を示して、子がロンしたときの点数を選ばせる。
 */
export const MANGAN_KO_RON_LESSON_QUIZ: LessonQuiz = buildTierQuiz((row) => ({
  kind: "points",
  points: row.ronKo,
}));
