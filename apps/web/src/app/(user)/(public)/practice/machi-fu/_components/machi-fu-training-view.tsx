"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createTrainingView } from "../../_lib/create-challenge-views";
import { MachiFuBoard } from "./machi-fu-board";

export const MachiFuTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.machiFu,
  renderBoard: ({ showFeedback, onAnswer }) => (
    <MachiFuBoard showFeedback={showFeedback} onAnswer={onAnswer} />
  ),
});
