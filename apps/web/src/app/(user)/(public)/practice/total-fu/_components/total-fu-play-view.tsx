"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { TotalFuBoard } from "./total-fu-board";

export const TotalFuPlayView = createChallengePlayView({
  slug: "total-fu",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer }) => (
    <TotalFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
    />
  ),
});
