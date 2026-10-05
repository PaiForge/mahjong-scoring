import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseMachiFuResults,
  type MachiFuQuestionResult,
} from "@mahjong-scoring/features/practice/machi-fu/types";

import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { MachiFuBoard } from "./machi-fu-board";
import { MachiFuProblemList } from "./machi-fu-problem-list";

/** 待ちの符計算の画面一式 */
export const machiFuScreens: PracticeScreens = {
  Play: createChallengePlayView<MachiFuQuestionResult>({
    slug: PRACTICE_SLUG.machiFu,
    renderBoard: (args) => (
      <MachiFuBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.machiFu,
    renderBoard: (args) => (
      <MachiFuBoard showFeedback={args.showFeedback} onAnswer={args.onAnswer} />
    ),
  }),
  Demo: () => <MachiFuBoard showFeedback={false} onAnswer={() => undefined} />,
  ProblemList: ({ results }) => (
    <MachiFuProblemList results={parseMachiFuResults(results)} />
  ),
};
