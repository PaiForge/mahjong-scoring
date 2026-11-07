"use client";

import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { ScoreCalculationBoard } from "./score-calculation-board";

export const ScoreCalculationTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.scoreCalculation,
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
