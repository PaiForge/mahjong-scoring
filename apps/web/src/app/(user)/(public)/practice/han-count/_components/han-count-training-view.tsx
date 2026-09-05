"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { useGeneratedScoreQuestion } from "../../_hooks/use-generated-score-question";
import { HanCountBoard } from "./han-count-board";
import type { HanCountQuestionState } from "./han-count-board";

export const HanCountTrainingView = createTrainingView<
  Record<string, never>,
  HanCountQuestionState
>({
  slug: PRACTICE_SLUG.hanCount,
  maxWidth: "max-w-2xl",
  useBoardState: () => useGeneratedScoreQuestion(),
  renderBoard: (
    { showFeedback, isTraining, onAnswer },
    _props,
    questionState,
  ) => (
    <HanCountBoard
      {...questionState}
      showFeedback={showFeedback}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
