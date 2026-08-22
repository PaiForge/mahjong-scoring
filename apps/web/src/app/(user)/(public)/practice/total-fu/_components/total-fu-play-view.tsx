"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { TotalFuQuestionResult } from "../_lib/types";
import { TotalFuBoard } from "./total-fu-board";

export const TotalFuPlayView = createChallengePlayView<TotalFuQuestionResult>({
  slug: "total-fu",
  maxWidth: "max-w-lg",
  // onProceed は渡さない。チャレンジ中は符の内訳を出さず、結果ページで振り返る。
  renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
    <TotalFuBoard
      showFeedback={showFeedback}
      isCountingDown={isCountingDown}
      onAnswer={onAnswer}
      onRecordResult={recordResult}
    />
  ),
});
