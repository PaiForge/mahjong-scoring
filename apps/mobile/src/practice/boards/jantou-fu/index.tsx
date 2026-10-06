import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseJantouFuResults,
  type JantouFuQuestionResult,
} from "@mahjong-scoring/features/practice/jantou-fu/types";

import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { JantouFuBoard } from "./jantou-fu-board";
import { JantouFuProblemList } from "./jantou-fu-problem-list";

/** 雀頭の符計算の画面一式 */
export const jantouFuScreens: PracticeScreens = {
  Play: createChallengePlayView<JantouFuQuestionResult>({
    slug: PRACTICE_SLUG.jantouFu,
    renderBoard: (args) => (
      <JantouFuBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.jantouFu,
    renderBoard: (args) => (
      <JantouFuBoard
        showFeedback={args.showFeedback}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: () => <JantouFuBoard showFeedback={false} onAnswer={() => undefined} />,
  ProblemList: ({ results }) => (
    <JantouFuProblemList results={parseJantouFuResults(results)} />
  ),
};
