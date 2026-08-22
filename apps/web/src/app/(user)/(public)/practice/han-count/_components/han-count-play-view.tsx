"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { HanCountBoard } from "./han-count-board";
import type { HanCountQuestionResult } from "../_lib/types";

export const HanCountPlayView = createChallengePlayView<HanCountQuestionResult>(
  {
    slug: "han-count",
    maxWidth: "max-w-2xl",
    renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
      <HanCountBoard
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
      />
    ),
  },
);
