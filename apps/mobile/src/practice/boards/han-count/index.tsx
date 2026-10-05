import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseHanCountResults,
  type HanCountQuestionResult,
} from "@mahjong-scoring/features/practice/han-count/types";

import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { HanCountBoard } from "./han-count-board";
import { HanCountProblemList } from "./han-count-problem-list";

/** 翻数即答の画面一式 */
export const hanCountScreens: PracticeScreens = {
  Play: createChallengePlayView<HanCountQuestionResult>({
    slug: PRACTICE_SLUG.hanCount,
    renderBoard: (args) => (
      <HanCountBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.hanCount,
    renderBoard: (args) => (
      <HanCountBoard
        showFeedback={args.showFeedback}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: () => <HanCountBoard showFeedback={false} onAnswer={() => undefined} />,
  ProblemList: ({ results }) => (
    <HanCountProblemList results={parseHanCountResults(results)} />
  ),
};
