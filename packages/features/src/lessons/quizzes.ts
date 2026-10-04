import { JANTOU_FU_LESSON_QUIZ } from "./jantou-fu";
import { MACHI_FU_LESSON_QUIZ } from "./machi-fu";
import { MANGAN_KO_RON_LESSON_QUIZ } from "./mangan-ko-ron";
import { MANGAN_KO_TSUMO_LESSON_QUIZ } from "./mangan-ko-tsumo";
import { MANGAN_OYA_RON_LESSON_QUIZ } from "./mangan-oya-ron";
import { MENTSU_FU_LESSON_QUIZ } from "./mentsu-fu";
import { MANGAN_OYA_TSUMO_LESSON_QUIZ } from "./mangan-oya-tsumo";
import type { LessonQuiz } from "./quiz";
import type { LessonSlug } from "./registry";
import { YAKU_LESSON_QUIZ } from "./yaku";

/**
 * レッスンごとの確認問題
 *
 * `Record<LessonSlug, …>` にして、レジストリにレッスンを足したら問題を
 * 書くまで型検査が通らないようにする。
 */
const LESSON_QUIZZES: Readonly<Record<LessonSlug, LessonQuiz>> = {
  "mangan-ko-ron": MANGAN_KO_RON_LESSON_QUIZ,
  "mangan-ko-tsumo": MANGAN_KO_TSUMO_LESSON_QUIZ,
  "mangan-oya-ron": MANGAN_OYA_RON_LESSON_QUIZ,
  "mangan-oya-tsumo": MANGAN_OYA_TSUMO_LESSON_QUIZ,
  yaku: YAKU_LESSON_QUIZ,
  "jantou-fu": JANTOU_FU_LESSON_QUIZ,
  "mentsu-fu": MENTSU_FU_LESSON_QUIZ,
  "machi-fu": MACHI_FU_LESSON_QUIZ,
};

/**
 * レッスンの確認問題を返す
 * レッスン確認問題取得
 */
export function lessonQuiz(slug: LessonSlug): LessonQuiz {
  return LESSON_QUIZZES[slug];
}
