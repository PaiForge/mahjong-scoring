"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { MentsuJantouFuBoard } from "./mentsu-jantou-fu-board";
import { MentsuJantouFuHelp } from "./mentsu-jantou-fu-help";

export const MentsuJantouFuTrainingView = createTrainingView({
  slug: "mentsu-jantou-fu",
  maxWidth: "max-w-lg",
  // 符目ごとの正解を突き合わせて読ませたいので、回答後は自動で次へ進めない
  holdAfterAnswer: true,
  help: <MentsuJantouFuHelp />,
  renderBoard: ({
    showFeedback,
    isTraining,
    lastAnswerCorrect,
    onAnswer,
    onProceed,
  }) => (
    <MentsuJantouFuBoard
      showFeedback={showFeedback}
      isTraining={isTraining}
      lastAnswerCorrect={lastAnswerCorrect}
      onAnswer={onAnswer}
      onProceed={onProceed}
    />
  ),
});
