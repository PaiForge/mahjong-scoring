"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { MentsuJantouFuQuestionResult } from "../_lib/types";
import { MentsuJantouFuBoard } from "./mentsu-jantou-fu-board";

export const MentsuJantouFuPlayView =
  createChallengePlayView<MentsuJantouFuQuestionResult>({
    slug: "mentsu-jantou-fu",
    maxWidth: "max-w-lg",
    renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
      <MentsuJantouFuBoard
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
      />
    ),
  });
