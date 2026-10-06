import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseQuestionResults,
  type ManganScoreCalculationQuestionResult,
} from "@mahjong-scoring/features/practice/mangan-score-calculation/types";

import { ScoreProblemList } from "../../components/score-problem-list";
import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";
import { ManganScoreCalculationHowToPlay } from "./mangan-score-calculation-how-to-play";

/** 満貫以上の点数計算の画面一式 */
export const manganScoreCalculationScreens: PracticeScreens = {
  Play: createChallengePlayView<ManganScoreCalculationQuestionResult>({
    slug: PRACTICE_SLUG.manganScoreCalculation,
    renderBoard: (args) => (
      <ManganScoreCalculationBoard
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.manganScoreCalculation,
    renderBoard: (args) => (
      <ManganScoreCalculationBoard
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isTraining={args.isTraining}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: ManganScoreCalculationHowToPlay,
  ProblemList: ({ results }) => (
    <ScoreProblemList
      results={parseQuestionResults(results)}
      translationNamespace="manganScoreCalculationChallenge"
    />
  ),
};
