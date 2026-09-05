"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { useGeneratedScoreQuestion } from "../../_hooks/use-generated-score-question";
import { HanCountBoard } from "./han-count-board";
import type { HanCountQuestionState } from "./han-count-board";
import type { HanCountQuestionResult } from "../_lib/types";

export const HanCountPlayView = createChallengePlayView<
  HanCountQuestionResult,
  Record<string, never>,
  HanCountQuestionState
>({
  slug: PRACTICE_SLUG.hanCount,
  maxWidth: "max-w-2xl",
  useBoardState: () => useGeneratedScoreQuestion(),
  renderBoard: (
    { showFeedback, isCountingDown, onAnswer, recordResult },
    _props,
    questionState,
  ) => (
    <HanCountBoard
      {...questionState}
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
      onRecordResult={recordResult}
    />
  ),
});
