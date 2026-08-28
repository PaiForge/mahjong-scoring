"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { YakuQuestionResult } from "../_lib/types";
import { YakuBoard } from "./yaku-board";

export const YakuPlayView = createChallengePlayView<YakuQuestionResult>({
  slug: "yaku",
  maxWidth: "max-w-2xl",
  renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
    <YakuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
      onRecordResult={recordResult}
    />
  ),
});
