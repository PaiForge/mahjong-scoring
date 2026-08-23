"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { JantouFuBoard } from "./jantou-fu-board";

export const JantouFuPlayView = createChallengePlayView({
  slug: "jantou-fu",
  showScoreCounter: true,
  renderBoard: ({ showFeedback, isCountingDown, onAnswer }) => (
    <JantouFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
    />
  ),
});
