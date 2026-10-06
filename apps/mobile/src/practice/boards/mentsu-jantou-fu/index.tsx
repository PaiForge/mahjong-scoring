import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseMentsuJantouFuResults,
  type MentsuJantouFuQuestionResult,
} from "@mahjong-scoring/features/practice/mentsu-jantou-fu/types";

import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { MentsuJantouFuBoard } from "./mentsu-jantou-fu-board";
import { MentsuJantouFuHelp } from "./mentsu-jantou-fu-help";
import { MentsuJantouFuHowToPlay } from "./mentsu-jantou-fu-how-to-play";
import { MentsuJantouFuProblemList } from "./mentsu-jantou-fu-problem-list";

/** 面子と雀頭の符計算の画面一式 */
export const mentsuJantouFuScreens: PracticeScreens = {
  Play: createChallengePlayView<MentsuJantouFuQuestionResult>({
    slug: PRACTICE_SLUG.mentsuJantouFu,
    renderBoard: (args) => (
      <MentsuJantouFuBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.mentsuJantouFu,
    help: <MentsuJantouFuHelp />,
    renderBoard: (args) => (
      <MentsuJantouFuBoard
        showFeedback={args.showFeedback}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: MentsuJantouFuHowToPlay,
  ProblemList: ({ results }) => (
    <MentsuJantouFuProblemList results={parseMentsuJantouFuResults(results)} />
  ),
};
