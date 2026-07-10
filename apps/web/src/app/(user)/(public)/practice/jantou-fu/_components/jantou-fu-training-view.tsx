"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { JantouFuBoard } from "./jantou-fu-board";

export const JantouFuTrainingView = createTrainingView({
  namespace: "jantouFu",
  slug: "jantou-fu",
  renderBoard: ({ showFeedback, onAnswer }) => (
    <JantouFuBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
