"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";

export const ManganScoreCalculationTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.manganScoreCalculation,
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
