import {
  PRACTICE_SLUG,
  resolvePracticeVariant,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  parseQuestionResults,
  type ScoreTableQuestionResult,
} from "@mahjong-scoring/features/practice/score-table/types";

import { ScoreProblemList } from "../../components/score-problem-list";
import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { ScoreTableVariantBoard } from "./score-table-board";
import { ScoreTableHowToPlay } from "./score-table-how-to-play";

/** 正規化済みのバリアントを点数表早引きのバリアント型へ絞る */
function scoreTableVariant(variant: string) {
  return resolvePracticeVariant(PRACTICE_SLUG.scoreTable, variant);
}

/** 点数表早引きの画面一式 */
export const scoreTableScreens: PracticeScreens = {
  Play: createChallengePlayView<ScoreTableQuestionResult>({
    slug: PRACTICE_SLUG.scoreTable,
    renderBoard: (args, props) => (
      <ScoreTableVariantBoard
        variant={scoreTableVariant(props.variant)}
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
    slug: PRACTICE_SLUG.scoreTable,
    renderBoard: (args, props) => (
      <ScoreTableVariantBoard
        variant={scoreTableVariant(props.variant)}
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isTraining
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: ScoreTableHowToPlay,
  ProblemList: ({ results }) => (
    <ScoreProblemList
      results={parseQuestionResults(results)}
      translationNamespace="scoreTableChallenge"
    />
  ),
};
