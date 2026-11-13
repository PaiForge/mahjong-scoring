import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { parseMachiFuResults } from "@mahjong-scoring/features/practice/machi-fu/types";

import { createRecordingBoardScreens } from "../../create-recording-board-screens";
import { MachiFuBoard } from "./machi-fu-board";
import { MachiFuProblemList } from "./machi-fu-problem-list";

/** 待ちの符計算の画面一式 */
export const machiFuScreens = createRecordingBoardScreens({
  slug: PRACTICE_SLUG.machiFu,
  Board: MachiFuBoard,
  ProblemList: MachiFuProblemList,
  parseResults: parseMachiFuResults,
});
