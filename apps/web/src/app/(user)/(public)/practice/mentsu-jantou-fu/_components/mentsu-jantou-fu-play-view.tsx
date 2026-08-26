"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { MentsuJantouFuBoard } from "./mentsu-jantou-fu-board";

export const MentsuJantouFuPlayView = createChallengePlayView({
  slug: "mentsu-jantou-fu",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer }) => (
    <MentsuJantouFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
    />
  ),
});
