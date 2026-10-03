"use client";

import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { JantouFuQuestionResult } from "@mahjong-scoring/features/practice/jantou-fu/types";
import { JantouFuBoard } from "./jantou-fu-board";

export const JantouFuPlayView = createChallengePlayView<JantouFuQuestionResult>(
  {
    slug: PRACTICE_SLUG.jantouFu,
    renderBoard: ({
      showFeedback,
      isCountingDown,
      onAnswer,
      recordResult,
      presentQuestion,
    }) => (
      <JantouFuBoard
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
        onPresentQuestion={presentQuestion}
      />
    ),
  },
);
