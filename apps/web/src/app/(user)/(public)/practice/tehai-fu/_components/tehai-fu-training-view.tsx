"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { TehaiFuBoard } from "./tehai-fu-board";

export const TehaiFuTrainingView = createTrainingView({
  slug: "tehai-fu",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, onAnswer }) => (
    <TehaiFuBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
