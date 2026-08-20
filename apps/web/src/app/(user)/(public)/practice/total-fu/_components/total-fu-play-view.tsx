"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { RESULT_STORAGE_KEY } from "../_lib/types";
import type { TotalFuQuestionResult } from "../_lib/types";
import { TotalFuBoard } from "./total-fu-board";

export const TotalFuPlayView = createChallengePlayView<TotalFuQuestionResult>({
  slug: "total-fu",
  maxWidth: "max-w-lg",
  resultStorageKey: RESULT_STORAGE_KEY,
  renderBoard: ({
    showFeedback,
    isCountingDown,
    lastAnswerCorrect,
    onAnswer,
    recordResult,
  }) => (
    <TotalFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      lastAnswerCorrect={lastAnswerCorrect}
      onAnswer={onAnswer}
      onRecordResult={recordResult}
    />
  ),
});
