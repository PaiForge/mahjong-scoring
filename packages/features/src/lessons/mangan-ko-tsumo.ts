import type { LessonQuiz } from "./quiz";
import { buildTierQuiz } from "./tier-quiz";

/**
 * 「子のツモ（満貫以上）」レッスンの確認問題
 * 子ツモレッスン確認問題
 *
 * 翻数を示して、子がツモしたときの支払い（子ひとり / 親）を選ばせる。
 * 合計ではなく支払いの組で問うのは、章が教えるのが「合計は子のロンと同じで、
 * それを子・子・親で分ける」ことだから。合計を問うと子のロンの問題と同じになる。
 */
export const MANGAN_KO_TSUMO_LESSON_QUIZ: LessonQuiz = buildTierQuiz((row) => ({
  kind: "koTsumo",
  fromKo: row.tsumoKo.fromKo,
  fromOya: row.tsumoKo.fromOya,
}));
