"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { MentsuFuQuestionResult } from "../_lib/types";
import { MentsuFuBoard } from "./mentsu-fu-board";

export const MentsuFuPlayView = createChallengePlayView<MentsuFuQuestionResult>(
  {
    slug: PRACTICE_SLUG.mentsuFu,
    renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
      <MentsuFuBoard
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
      />
    ),
  },
);
