"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";

export const ManganScoreCalculationTrainingView = createTrainingView({
  slug: "mangan-score-calculation",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, lastAnswerCorrect, isTraining, onAnswer }) => (
    <ManganScoreCalculationBoard
      playerType="random"
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
