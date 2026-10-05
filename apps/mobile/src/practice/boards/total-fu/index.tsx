import { useCallback } from "react";
import { generateTotalFuQuestion, retryGenerate } from "@mahjong-scoring/core";
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseFuQuestionResults,
  QUESTION_GENERATION_MAX_RETRIES,
  type TotalFuQuestionResult,
} from "@mahjong-scoring/features/practice/total-fu/types";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import type { RecordingPracticeBoardProps } from "../../board-props";
import { FuProblemList } from "../../components/fu-problem-list";
import { TotalFuQuestionBoard } from "../../components/total-fu-question-board";
import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";

/** 手牌の合計符の盤面（web の `TotalFuBoard`） */
function TotalFuBoard(
  props: RecordingPracticeBoardProps<TotalFuQuestionResult>,
) {
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generateQuestion = useCallback(
    () =>
      retryGenerate(
        () => generateTotalFuQuestion({ renfonpaiAs4Fu }),
        QUESTION_GENERATION_MAX_RETRIES,
      ),
    [renfonpaiAs4Fu],
  );
  return (
    <TotalFuQuestionBoard
      {...props}
      generateQuestion={generateQuestion}
      translationNamespace="totalFu"
    />
  );
}

/** 手牌の合計符の画面一式 */
export const totalFuScreens: PracticeScreens = {
  Play: createChallengePlayView<TotalFuQuestionResult>({
    slug: PRACTICE_SLUG.totalFu,
    renderBoard: (args) => (
      <TotalFuBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.totalFu,
    renderBoard: (args) => (
      <TotalFuBoard showFeedback={args.showFeedback} onAnswer={args.onAnswer} />
    ),
  }),
  Demo: () => <TotalFuBoard showFeedback={false} onAnswer={() => undefined} />,
  ProblemList: ({ results }) => (
    <FuProblemList
      results={parseFuQuestionResults(results)}
      translationNamespace="totalFu"
    />
  ),
};
