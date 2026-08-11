"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { MachiFuBoard } from "./machi-fu-board";

export const MachiFuTrainingView = createTrainingView({
  slug: "machi-fu",
  renderBoard: ({ showFeedback, onAnswer }) => (
    <MachiFuBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
