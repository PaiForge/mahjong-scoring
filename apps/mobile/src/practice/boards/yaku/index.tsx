import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseYakuResults,
  type YakuQuestionResult,
} from "@mahjong-scoring/features/practice/yaku/types";

import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { YakuBoard } from "./yaku-board";
import { YakuProblemList } from "./yaku-problem-list";

/** 役の選択の画面一式 */
export const yakuScreens: PracticeScreens = {
  Play: createChallengePlayView<YakuQuestionResult>({
    slug: PRACTICE_SLUG.yaku,
    renderBoard: (args) => (
      <YakuBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        lastAnswerCorrect={args.lastAnswerCorrect}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.yaku,
    hasSubmitButton: true,
    renderBoard: (args) => (
      <YakuBoard
        showFeedback={args.showFeedback}
        isTraining={args.isTraining}
        lastAnswerCorrect={args.lastAnswerCorrect}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: () => <YakuBoard showFeedback={false} onAnswer={() => undefined} />,
  ProblemList: ({ results }) => (
    <YakuProblemList results={parseYakuResults(results)} />
  ),
};
