import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { CHIITOITSU_EXAM_DEMO_OPTIONS } from "@mahjong-scoring/features/exam/chiitoitsu/demo-question";
import { EXAM_GENERATE_OPTIONS } from "@mahjong-scoring/features/exam/chiitoitsu/types";

import { createScoreExamBoard } from "../../exam/create-score-exam-board";
import { createScoreExamHowToPlay } from "../../exam/create-score-exam-how-to-play";
import { createScoreExamScreens } from "../../exam/create-score-exam-screens";
import type { PracticeScreens } from "../../practice-screens";

/**
 * 昇級試験（七対子の点数計算）の出題盤面（web の `ChiitoitsuExamBoard`）
 * 昇級試験盤面
 *
 * 符は25符で固定なので、翻数を数えて点数表を引くところまでを測る。
 * 役一覧は出さない（受験者が手牌から翻数を数える）。
 */
const ChiitoitsuExamBoard = createScoreExamBoard({
  translationNamespace: "chiitoitsuExamChallenge",
  generateOptions: EXAM_GENERATE_OPTIONS,
  scoreRange: "nonMangan",
});

/** 昇級試験（七対子の点数計算）の画面一式（モバイルが開くのは模試だけ） */
export const chiitoitsuExamScreens: PracticeScreens = createScoreExamScreens({
  slug: PRACTICE_SLUG.chiitoitsuExam,
  translationNamespace: "chiitoitsuExamChallenge",
  Board: ChiitoitsuExamBoard,
  Demo: createScoreExamHowToPlay(
    "chiitoitsuExamChallenge",
    CHIITOITSU_EXAM_DEMO_OPTIONS,
  ),
});
