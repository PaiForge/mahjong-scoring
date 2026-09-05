"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { MentsuJantouFuBoard } from "./mentsu-jantou-fu-board";
import { MentsuJantouFuHelp } from "./mentsu-jantou-fu-help";

export const MentsuJantouFuTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.mentsuJantouFu,
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
