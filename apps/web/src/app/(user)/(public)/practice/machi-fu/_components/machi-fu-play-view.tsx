"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { MachiFuBoard } from "./machi-fu-board";

export const MachiFuPlayView = createChallengePlayView({
  namespace: "machiFu",
  menuType: "machi_fu",
  slug: "machi-fu",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer }) => (
    <MachiFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
    />
  ),
});
