import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { parseMentsuFuResults } from "@mahjong-scoring/features/practice/mentsu-fu/types";

import { createRecordingBoardScreens } from "../../create-recording-board-screens";
import { MentsuFuBoard } from "./mentsu-fu-board";
import { MentsuFuProblemList } from "./mentsu-fu-problem-list";

/** 面子の符計算の画面一式 */
export const mentsuFuScreens = createRecordingBoardScreens({
  slug: PRACTICE_SLUG.mentsuFu,
  Board: MentsuFuBoard,
  ProblemList: MentsuFuProblemList,
  parseResults: parseMentsuFuResults,
});
