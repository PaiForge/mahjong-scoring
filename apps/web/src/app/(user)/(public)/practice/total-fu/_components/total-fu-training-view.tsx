"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { TotalFuBoard } from "./total-fu-board";

export const TotalFuTrainingView = createTrainingView({
  slug: "total-fu",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, onAnswer }) => (
    <TotalFuBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
