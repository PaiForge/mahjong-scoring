"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { MentsuJantouFuBoard } from "./mentsu-jantou-fu-board";
import { MentsuJantouFuHelp } from "./mentsu-jantou-fu-help";

export const MentsuJantouFuTrainingView = createTrainingView({
  slug: "mentsu-jantou-fu",
  maxWidth: "max-w-lg",
  help: <MentsuJantouFuHelp />,
  renderBoard: ({ showFeedback, isTraining, onAnswer }) => (
    <MentsuJantouFuBoard
      showFeedback={showFeedback}
      isTraining={isTraining}
      onAnswer={onAnswer}
    />
  ),
});
