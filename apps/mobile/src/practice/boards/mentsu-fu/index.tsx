import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseMentsuFuResults,
  type MentsuFuQuestionResult,
} from "@mahjong-scoring/features/practice/mentsu-fu/types";

import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { MentsuFuBoard } from "./mentsu-fu-board";
import { MentsuFuProblemList } from "./mentsu-fu-problem-list";

/** 面子の符計算の画面一式 */
export const mentsuFuScreens: PracticeScreens = {
  Play: createChallengePlayView<MentsuFuQuestionResult>({
    slug: PRACTICE_SLUG.mentsuFu,
    renderBoard: (args) => (
      <MentsuFuBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.mentsuFu,
    renderBoard: (args) => (
      <MentsuFuBoard
        showFeedback={args.showFeedback}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: () => <MentsuFuBoard showFeedback={false} onAnswer={() => undefined} />,
  ProblemList: ({ results }) => (
    <MentsuFuProblemList results={parseMentsuFuResults(results)} />
  ),
};
