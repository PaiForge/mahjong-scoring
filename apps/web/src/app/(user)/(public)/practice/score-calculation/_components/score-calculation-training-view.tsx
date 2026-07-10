"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { ScoreCalculationBoard } from "./score-calculation-board";

export const ScoreCalculationTrainingView = createTrainingView({
  namespace: "scoreCalculationChallenge",
  slug: "score-calculation",
  maxWidth: "max-w-lg",
  renderBoard: ({ showFeedback, lastAnswerCorrect, onAnswer }) => (
    <ScoreCalculationBoard
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      onAnswer={onAnswer}
    />
  ),
});
