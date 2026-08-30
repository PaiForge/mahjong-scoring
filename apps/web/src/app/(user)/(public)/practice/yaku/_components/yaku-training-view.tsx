"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { YakuBoard } from "./yaku-board";

export const YakuTrainingView = createTrainingView({
  slug: "yaku",
  maxWidth: "max-w-2xl",
  renderBoard: ({ showFeedback, isTraining, lastAnswerCorrect, onAnswer }) => (
    <YakuBoard
      showFeedback={showFeedback}
      isTraining={isTraining}
      lastAnswerCorrect={lastAnswerCorrect}
      onAnswer={onAnswer}
    />
  ),
});
