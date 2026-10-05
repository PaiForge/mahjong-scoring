import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { PINFU_EXAM_DEMO_OPTIONS } from "@mahjong-scoring/features/exam/pinfu/demo-question";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
} from "@mahjong-scoring/features/exam/pinfu/types";

import { createScoreExamBoard } from "../../exam/create-score-exam-board";
import { createScoreExamHowToPlay } from "../../exam/create-score-exam-how-to-play";
import { createScoreExamScreens } from "../../exam/create-score-exam-screens";
import type { PracticeScreens } from "../../practice-screens";

/**
 * 昇級試験（平和の点数計算）の出題盤面（web の `PinfuExamBoard`）
 * 昇級試験盤面
 *
 * 符はツモ20符・ロン30符で固定なので、翻数を数えて点数表を引くところまでを測る。
 * 役一覧は出さない（受験者が手牌から翻数を数える）。
 */
const PinfuExamBoard = createScoreExamBoard({
  translationNamespace: "pinfuExamChallenge",
  generateOptions: EXAM_GENERATE_OPTIONS,
  scoreRange: "nonMangan",
  maxRetries: EXAM_GENERATION_MAX_RETRIES,
});

/** 昇級試験（平和の点数計算）の画面一式（モバイルが開くのは模試だけ） */
export const pinfuExamScreens: PracticeScreens = createScoreExamScreens({
  slug: PRACTICE_SLUG.pinfuExam,
  translationNamespace: "pinfuExamChallenge",
  Board: PinfuExamBoard,
  Demo: createScoreExamHowToPlay("pinfuExamChallenge", PINFU_EXAM_DEMO_OPTIONS),
});
