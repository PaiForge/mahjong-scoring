"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { TehaiFuBoard } from "./tehai-fu-board";

export const TehaiFuTrainingView = createTrainingView({
  slug: "tehai-fu",
  maxWidth: "max-w-lg",
  // 符目ごとの正解を突き合わせて読ませたいので、不正解のときは自動で次へ進めない
  holdOnIncorrect: true,
  renderBoard: ({ showFeedback, lastAnswerCorrect, onAnswer, onProceed }) => (
    <TehaiFuBoard
      showFeedback={showFeedback}
      lastAnswerCorrect={lastAnswerCorrect}
      onAnswer={onAnswer}
      onProceed={onProceed}
    />
  ),
});
