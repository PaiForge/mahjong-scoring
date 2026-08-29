"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { ScoreCalculationBoard } from "./score-calculation-board";

export const ScoreCalculationTrainingView = createTrainingView({
  slug: "score-calculation",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, isTraining, onAnswer }) => (
    <ScoreCalculationBoard
      showFeedback={showFeedback}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
