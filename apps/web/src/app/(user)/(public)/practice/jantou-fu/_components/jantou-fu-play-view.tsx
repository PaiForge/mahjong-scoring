"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { JantouFuQuestionResult } from "../_lib/types";
import { JantouFuBoard } from "./jantou-fu-board";

export const JantouFuPlayView = createChallengePlayView<JantouFuQuestionResult>(
  {
    slug: "jantou-fu",
    showScoreCounter: true,
    renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
      <JantouFuBoard
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
      />
    ),
  },
);
