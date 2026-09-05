"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { MachiFuQuestionResult } from "../_lib/types";
import { MachiFuBoard } from "./machi-fu-board";

export const MachiFuPlayView = createChallengePlayView<MachiFuQuestionResult>({
  slug: PRACTICE_SLUG.machiFu,
  renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
    <MachiFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
      onRecordResult={recordResult}
    />
  ),
});
