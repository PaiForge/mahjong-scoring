import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { FU_SCORE_EXAM_DEMO_OPTIONS } from "@mahjong-scoring/features/exam/fu-score/demo-question";
import { EXAM_BOARD_CONFIG } from "@mahjong-scoring/features/exam/fu-score/types";

import { createScoreExamBoard } from "../../exam/create-score-exam-board";
import { createScoreExamHowToPlay } from "../../exam/create-score-exam-how-to-play";
import { createScoreExamScreens } from "../../exam/create-score-exam-screens";
import type { PracticeScreens } from "../../practice-screens";

/**
 * 昇級試験（30〜50符の点数計算）の出題盤面（web の `FuScoreExamBoard`）
 * 昇級試験盤面
 *
 * 符も翻数も自分で出し、点数まで通しで答える。
 * 役一覧は出さない（受験者が手牌から翻数を数える）。
 */
const FuScoreExamBoard = createScoreExamBoard(EXAM_BOARD_CONFIG);

/** 昇級試験（30〜50符の点数計算）の画面一式（モバイルが開くのは模試だけ） */
export const fuScoreExamScreens: PracticeScreens = createScoreExamScreens({
  slug: PRACTICE_SLUG.fuScoreExam,
  translationNamespace: EXAM_BOARD_CONFIG.translationNamespace,
  Board: FuScoreExamBoard,
  Demo: createScoreExamHowToPlay(
    EXAM_BOARD_CONFIG.translationNamespace,
    FU_SCORE_EXAM_DEMO_OPTIONS,
  ),
});
