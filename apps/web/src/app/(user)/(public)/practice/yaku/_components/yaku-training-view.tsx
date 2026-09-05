"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { YakuBoard } from "./yaku-board";

export const YakuTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.yaku,
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
