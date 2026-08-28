"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { MachiFuQuestionResult } from "../_lib/types";
import { MachiFuBoard } from "./machi-fu-board";

export const MachiFuPlayView = createChallengePlayView<MachiFuQuestionResult>({
  slug: "machi-fu",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
    <MachiFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
      onRecordResult={recordResult}
    />
  ),
});
