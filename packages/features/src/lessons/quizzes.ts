import { MANGAN_KO_RON_LESSON_QUIZ } from "./mangan-ko-ron";
import type { LessonQuiz } from "./quiz";
import type { LessonSlug } from "./registry";

/**
 * レッスンごとの確認問題
 *
 * `Record<LessonSlug, …>` にして、レジストリにレッスンを足したら問題を
 * 書くまで型検査が通らないようにする。
 */
const LESSON_QUIZZES: Readonly<Record<LessonSlug, LessonQuiz>> = {
  "mangan-ko-ron": MANGAN_KO_RON_LESSON_QUIZ,
};

/**
 * レッスンの確認問題を返す
 * レッスン確認問題取得
 */
export function lessonQuiz(slug: LessonSlug): LessonQuiz {
  return LESSON_QUIZZES[slug];
}
