import { HAND_SHAPE_FURO } from "../practice/score/hand-shape-param";
import { buildExtraFuQuiz } from "./extra-fu-quiz";
import type { LessonQuiz } from "./quiz";

/**
 * 「鳴いた手の点数計算」レッスンの確認問題
 * 副露手レッスン確認問題
 *
 * 鳴いた手の、積み上げた符とツモ / ロンを示して、手牌の符を選ばせる。
 * 章の「門前との違いはロンの出発点が 20 符になることだけ」と、その例外・
 * 逆転を確かめる。
 * 1. ロン・4 符 → 30 符 — ロンは 20 符に切り上げた分を足す
 * 2. ロン・0 符 → 30 符 — 食い平和形は 20 符ではなく 30 符（コラム）
 * 3. ツモ・10 符 → 40 符 — ツモは門前と同じ
 * 4. ロン・10 符 → 30 符 — 同じ 10 符でもロンはツモより低い（逆転）
 */
export const FURO_SCORE_LESSON_QUIZ: LessonQuiz = buildExtraFuQuiz(
  HAND_SHAPE_FURO,
  [
    { key: "ron4", winType: "ron", extraFu: 4 },
    { key: "ron0", winType: "ron", extraFu: 0 },
    { key: "tsumo10", winType: "tsumo", extraFu: 10 },
    { key: "ron10", winType: "ron", extraFu: 10 },
  ],
);
