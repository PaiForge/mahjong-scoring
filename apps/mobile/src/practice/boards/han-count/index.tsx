import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { parseHanCountResults } from "@mahjong-scoring/features/practice/han-count/types";

import { createRecordingBoardScreens } from "../../create-recording-board-screens";
import { HanCountBoard } from "./han-count-board";
import { HanCountProblemList } from "./han-count-problem-list";

/** 翻数即答の画面一式 */
export const hanCountScreens = createRecordingBoardScreens({
  slug: PRACTICE_SLUG.hanCount,
  Board: HanCountBoard,
  ProblemList: HanCountProblemList,
  parseResults: parseHanCountResults,
});
