"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { JantouFuQuestionResult } from "../_lib/types";
import { JantouFuBoard } from "./jantou-fu-board";

export const JantouFuPlayView = createChallengePlayView<JantouFuQuestionResult>(
  {
    slug: PRACTICE_SLUG.jantouFu,
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
