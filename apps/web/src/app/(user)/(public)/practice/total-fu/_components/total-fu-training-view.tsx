"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { TotalFuBoard } from "./total-fu-board";

export const TotalFuTrainingView = createTrainingView({
  slug: "total-fu",
  maxWidth: "max-w-lg",
  // 符の内訳を読ませたいので、不正解のときは自動で次へ進めない
  holdOnIncorrect: true,
  renderBoard: ({ showFeedback, lastAnswerCorrect, onAnswer, onProceed }) => (
    <TotalFuBoard
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      onAnswer={onAnswer}
      onProceed={onProceed}
    />
  ),
});
