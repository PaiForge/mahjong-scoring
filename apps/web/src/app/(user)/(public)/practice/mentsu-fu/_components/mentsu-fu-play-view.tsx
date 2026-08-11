"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { MentsuFuBoard } from "./mentsu-fu-board";

export const MentsuFuPlayView = createChallengePlayView({
  slug: "mentsu-fu",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer }) => (
    <MentsuFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
    />
  ),
});
