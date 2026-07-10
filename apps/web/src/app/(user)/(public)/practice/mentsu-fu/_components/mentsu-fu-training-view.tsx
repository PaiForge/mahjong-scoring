"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { MentsuFuBoard } from "./mentsu-fu-board";

export const MentsuFuTrainingView = createTrainingView({
  namespace: "mentsuFu",
  slug: "mentsu-fu",
  renderBoard: ({ showFeedback, onAnswer }) => (
    <MentsuFuBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
