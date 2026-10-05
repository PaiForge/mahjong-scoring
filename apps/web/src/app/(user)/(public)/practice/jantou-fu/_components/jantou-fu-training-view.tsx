"use client";

import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { JantouFuBoard } from "./jantou-fu-board";

export const JantouFuTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.jantouFu,
  renderBoard: ({ showFeedback, onAnswer }) => (
    <JantouFuBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
