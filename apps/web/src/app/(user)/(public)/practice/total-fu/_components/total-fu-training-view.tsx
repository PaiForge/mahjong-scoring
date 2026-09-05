"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { TotalFuBoard } from "./total-fu-board";

export const TotalFuTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.totalFu,
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, isTraining, onAnswer }) => (
    <TotalFuBoard
      showFeedback={showFeedback}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
