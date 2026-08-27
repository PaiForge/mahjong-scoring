"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { TotalFuBoard } from "./total-fu-board";

export const TotalFuTrainingView = createTrainingView({
  slug: "total-fu",
  maxWidth: "max-w-lg",
  // 符の内訳を読ませたいので、回答後は自動で次へ進めない
  holdAfterAnswer: true,
  renderBoard: ({ showFeedback, isTraining, onAnswer, onProceed }) => (
    <TotalFuBoard
      showFeedback={showFeedback}
      isTraining={isTraining}
      onAnswer={onAnswer}
      onProceed={onProceed}
    />
  ),
});
