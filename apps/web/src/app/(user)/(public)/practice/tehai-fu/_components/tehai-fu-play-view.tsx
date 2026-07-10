"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { TehaiFuBoard } from "./tehai-fu-board";

export const TehaiFuPlayView = createChallengePlayView({
  namespace: "tehaiFu",
  menuType: "tehai_fu",
  slug: "tehai-fu",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer }) => (
    <TehaiFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
    />
  ),
});
