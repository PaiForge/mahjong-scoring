"use client";

import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { MentsuJantouFuQuestionResult } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/types";
import { MentsuJantouFuBoard } from "./mentsu-jantou-fu-board";

export const MentsuJantouFuPlayView =
  createChallengePlayView<MentsuJantouFuQuestionResult>({
    slug: PRACTICE_SLUG.mentsuJantouFu,
    maxWidth: "max-w-lg",
    renderBoard: ({
      showFeedback,
      isCountingDown,
      onAnswer,
      recordResult,
      presentQuestion,
    }) => (
      <MentsuJantouFuBoard
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
        onPresentQuestion={presentQuestion}
      />
    ),
  });
