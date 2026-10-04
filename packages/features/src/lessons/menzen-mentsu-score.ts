import { HAND_SHAPE_MENZEN } from "../practice/score/hand-shape-param";
import { buildExtraFuQuiz } from "./extra-fu-quiz";
import type { LessonQuiz } from "./quiz";

/**
 * 「平和以外の門前面子手の点数計算」レッスンの確認問題
 * 門前面子手レッスン確認問題
 *
 * 門前の手の、積み上げた符とツモ / ロンを示して、手牌の符を選ばせる。
 * 章の「ツモは切り捨て・ロンは切り上げて 30 符に足す」を、境目をまたぐ
 * 順に確かめる。
 * 1. ロン・2 符 → 40 符 — 平和でない門前のロンは 40 符から
 * 2. ツモ・8 符 → 30 符 — 么九牌の暗刻 1 つだけでは 10 符に届かない（コラム）
 * 3. ツモ・10 符 → 40 符 — 10 符に届くとツモも上がる
 * 4. ロン・12 符 → 50 符 — 同じ積み上げでもロンはツモより 10 符上
 */
export const MENZEN_MENTSU_SCORE_LESSON_QUIZ: LessonQuiz = buildExtraFuQuiz(
  HAND_SHAPE_MENZEN,
  [
    { key: "ron2", winType: "ron", extraFu: 2 },
    { key: "tsumo8", winType: "tsumo", extraFu: 8 },
    { key: "tsumo10", winType: "tsumo", extraFu: 10 },
    { key: "ron12", winType: "ron", extraFu: 12 },
  ],
);
