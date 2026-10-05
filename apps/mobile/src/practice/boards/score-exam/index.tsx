import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { SCORE_EXAM_DEMO_OPTIONS } from "@mahjong-scoring/features/exam/score/demo-question";
import { EXAM_BOARD_CONFIG } from "@mahjong-scoring/features/exam/score/types";

import { createScoreExamBoard } from "../../exam/create-score-exam-board";
import { createScoreExamHowToPlay } from "../../exam/create-score-exam-how-to-play";
import { createScoreExamScreens } from "../../exam/create-score-exam-screens";
import type { PracticeScreens } from "../../practice-screens";

/**
 * 昇段試験（あらゆる手の点数計算）の出題盤面（web の `ScoreExamBoard`）
 * 昇段試験盤面
 *
 * 点数帯を絞らず、どんな手でも符と翻数から点数まで通しで答える。
 * 役一覧は出さない（受験者が手牌から翻数を数える）。
 */
const ScoreExamBoard = createScoreExamBoard(EXAM_BOARD_CONFIG);

/** 昇段試験（あらゆる手の点数計算）の画面一式（モバイルが開くのは模試だけ） */
export const scoreExamScreens: PracticeScreens = createScoreExamScreens({
  slug: PRACTICE_SLUG.scoreExam,
  translationNamespace: EXAM_BOARD_CONFIG.translationNamespace,
  Board: ScoreExamBoard,
  Demo: createScoreExamHowToPlay(
    EXAM_BOARD_CONFIG.translationNamespace,
    SCORE_EXAM_DEMO_OPTIONS,
  ),
});
