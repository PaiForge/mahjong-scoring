"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { YakuQuestionResult } from "../_lib/types";
import { YakuBoard } from "./yaku-board";

export const YakuPlayView = createChallengePlayView<YakuQuestionResult>({
  slug: PRACTICE_SLUG.yaku,
  maxWidth: "max-w-2xl",
  renderBoard: ({
    showFeedback,
    isCountingDown,
    lastAnswerCorrect,
    onAnswer,
    recordResult,
  }) => (
    <YakuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      lastAnswerCorrect={lastAnswerCorrect}
      onAnswer={onAnswer}
      onRecordResult={recordResult}
    />
  ),
});
