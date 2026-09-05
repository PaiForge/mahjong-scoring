"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { MentsuFuBoard } from "./mentsu-fu-board";

export const MentsuFuTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.mentsuFu,
  renderBoard: ({ showFeedback, onAnswer }) => (
    <MentsuFuBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
