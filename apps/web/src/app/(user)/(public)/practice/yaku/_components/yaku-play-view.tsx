"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { YakuBoard } from "./yaku-board";

export const YakuPlayView = createChallengePlayView({
  namespace: "yaku",
  menuType: "yaku",
  slug: "yaku",
  maxWidth: "max-w-2xl",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer }) => (
    <YakuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
    />
  ),
});
