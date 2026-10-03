import type { LessonQuiz } from "./quiz";
import { buildTierQuiz } from "./tier-quiz";

/**
 * 「親のツモ（満貫以上）」レッスンの確認問題
 * 親ツモレッスン確認問題
 *
 * 翻数を示して、親がツモしたときに子ひとりが払う額（オール）を選ばせる。
 */
export const MANGAN_OYA_TSUMO_LESSON_QUIZ: LessonQuiz = buildTierQuiz(
  (row) => ({ kind: "oyaTsumo", all: row.tsumoOya.all }),
);
