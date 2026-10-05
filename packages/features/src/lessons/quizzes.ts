import { CHIITOITSU_SCORE_LESSON_QUIZ } from "./chiitoitsu-score";
import { FURO_SCORE_LESSON_QUIZ } from "./furo-score";
import { JANTOU_FU_LESSON_QUIZ } from "./jantou-fu";
import { MACHI_FU_LESSON_QUIZ } from "./machi-fu";
import { MANGAN_KO_RON_LESSON_QUIZ } from "./mangan-ko-ron";
import { MANGAN_KO_TSUMO_LESSON_QUIZ } from "./mangan-ko-tsumo";
import { MANGAN_OYA_RON_LESSON_QUIZ } from "./mangan-oya-ron";
import { MENZEN_MENTSU_SCORE_LESSON_QUIZ } from "./menzen-mentsu-score";
import { MENTSU_FU_LESSON_QUIZ } from "./mentsu-fu";
import { MANGAN_OYA_TSUMO_LESSON_QUIZ } from "./mangan-oya-tsumo";
import type { LessonQuiz } from "./quiz";
import type { QuizLessonSlug } from "./registry";
import { PINFU_SCORE_LESSON_QUIZ } from "./pinfu-score";
import { TEHAI_FU_LESSON_QUIZ } from "./tehai-fu";
import { YAKU_LESSON_QUIZ } from "./yaku";

/**
 * 確認問題を持つレッスンごとの問題
 *
 * `Record<QuizLessonSlug, …>` にして、レジストリにレッスンを足したら問題を
 * 書くまで型検査が通らないようにする。
 */
const LESSON_QUIZZES: Readonly<Record<QuizLessonSlug, LessonQuiz>> = {
  "mangan-ko-ron": MANGAN_KO_RON_LESSON_QUIZ,
  "mangan-ko-tsumo": MANGAN_KO_TSUMO_LESSON_QUIZ,
  "mangan-oya-ron": MANGAN_OYA_RON_LESSON_QUIZ,
  "mangan-oya-tsumo": MANGAN_OYA_TSUMO_LESSON_QUIZ,
  yaku: YAKU_LESSON_QUIZ,
  "jantou-fu": JANTOU_FU_LESSON_QUIZ,
  "mentsu-fu": MENTSU_FU_LESSON_QUIZ,
  "machi-fu": MACHI_FU_LESSON_QUIZ,
  "tehai-fu": TEHAI_FU_LESSON_QUIZ,
  "chiitoitsu-score": CHIITOITSU_SCORE_LESSON_QUIZ,
  "pinfu-score": PINFU_SCORE_LESSON_QUIZ,
  "menzen-mentsu-score": MENZEN_MENTSU_SCORE_LESSON_QUIZ,
  "furo-score": FURO_SCORE_LESSON_QUIZ,
};

/**
 * レッスンの確認問題を返す
 * レッスン確認問題取得
 */
export function lessonQuiz(slug: QuizLessonSlug): LessonQuiz {
  return LESSON_QUIZZES[slug];
}
