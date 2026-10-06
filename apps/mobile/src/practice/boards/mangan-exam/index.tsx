import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { MANGAN_EXAM_DEMO_OPTIONS } from "@mahjong-scoring/features/exam/mangan/demo-question";
import { EXAM_BOARD_CONFIG } from "@mahjong-scoring/features/exam/mangan/types";

import { createScoreExamBoard } from "../../exam/create-score-exam-board";
import { createScoreExamHowToPlay } from "../../exam/create-score-exam-how-to-play";
import { createScoreExamScreens } from "../../exam/create-score-exam-screens";
import type { PracticeScreens } from "../../practice-screens";

/**
 * 昇級試験（満貫以上の点数計算）の出題盤面（web の `ManganExamBoard`）
 * 昇級試験盤面
 *
 * 5翻以上は符が点数に効かないので、符の積み上げは問わない。回答の選択肢は満貫以上に固定する。
 * 役一覧は出さない（受験者が手牌から翻数を数える）。
 */
const ManganExamBoard = createScoreExamBoard(EXAM_BOARD_CONFIG);

/** 昇級試験（満貫以上の点数計算）の画面一式（モバイルが開くのは模試だけ） */
export const manganExamScreens: PracticeScreens = createScoreExamScreens({
  slug: PRACTICE_SLUG.manganExam,
  translationNamespace: EXAM_BOARD_CONFIG.translationNamespace,
  Board: ManganExamBoard,
  Demo: createScoreExamHowToPlay(
    EXAM_BOARD_CONFIG.translationNamespace,
    MANGAN_EXAM_DEMO_OPTIONS,
  ),
});
