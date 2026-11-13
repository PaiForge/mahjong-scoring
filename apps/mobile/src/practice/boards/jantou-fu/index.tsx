import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { parseJantouFuResults } from "@mahjong-scoring/features/practice/jantou-fu/types";

import { createRecordingBoardScreens } from "../../create-recording-board-screens";
import { JantouFuBoard } from "./jantou-fu-board";
import { JantouFuProblemList } from "./jantou-fu-problem-list";

/** 雀頭の符計算の画面一式 */
export const jantouFuScreens = createRecordingBoardScreens({
  slug: PRACTICE_SLUG.jantouFu,
  Board: JantouFuBoard,
  ProblemList: JantouFuProblemList,
  parseResults: parseJantouFuResults,
});
