"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { JantouFuBoard } from "./jantou-fu-board";

export const JantouFuPlayView = createChallengePlayView({
  namespace: "jantouFu",
  menuType: "jantou_fu",
  slug: "jantou-fu",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer }) => (
    <JantouFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
    />
  ),
});
