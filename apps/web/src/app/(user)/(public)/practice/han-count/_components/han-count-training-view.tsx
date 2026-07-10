"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { HanCountBoard } from "./han-count-board";

export const HanCountTrainingView = createTrainingView({
  namespace: "hanCountChallenge",
  slug: "han-count",
  maxWidth: "max-w-2xl",
  renderBoard: ({ showFeedback, onAnswer }) => (
    <HanCountBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
