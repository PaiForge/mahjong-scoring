import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseQuestionResults,
  type ScoreCalculationQuestionResult,
} from "@mahjong-scoring/features/practice/score-calculation/types";

import { ScoreProblemList } from "../../components/score-problem-list";
import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { ScoreCalculationBoard } from "./score-calculation-board";
import { ScoreCalculationHowToPlay } from "./score-calculation-how-to-play";

/** 点数即答の画面一式 */
export const scoreCalculationScreens: PracticeScreens = {
  Play: createChallengePlayView<ScoreCalculationQuestionResult>({
    slug: PRACTICE_SLUG.scoreCalculation,
    renderBoard: (args) => (
      <ScoreCalculationBoard
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
    slug: PRACTICE_SLUG.scoreCalculation,
    renderBoard: (args) => (
      <ScoreCalculationBoard
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isTraining={args.isTraining}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: ScoreCalculationHowToPlay,
  ProblemList: ({ results }) => (
    <ScoreProblemList
      results={parseQuestionResults(results)}
      translationNamespace="scoreCalculationChallenge"
    />
  ),
};
