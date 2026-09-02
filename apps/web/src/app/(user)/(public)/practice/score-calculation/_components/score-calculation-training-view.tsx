"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { ScoreCalculationBoard } from "./score-calculation-board";

export const ScoreCalculationTrainingView = createTrainingView({
  slug: "score-calculation",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, lastAnswerCorrect, isTraining, onAnswer }) => (
    <ScoreCalculationBoard
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
