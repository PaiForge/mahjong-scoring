"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";

export const ManganScoreCalculationTrainingView = createTrainingView({
  slug: "mangan-score-calculation",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, isTraining, onAnswer }) => (
    <ManganScoreCalculationBoard
      playerType="random"
      showFeedback={showFeedback}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
