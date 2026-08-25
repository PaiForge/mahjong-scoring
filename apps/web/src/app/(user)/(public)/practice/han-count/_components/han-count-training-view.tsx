"use client";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { useGeneratedScoreQuestion } from "../../_hooks/use-generated-score-question";
import { HanCountBoard } from "./han-count-board";
import type { HanCountQuestionState } from "./han-count-board";

export const HanCountTrainingView = createTrainingView<
  Record<string, never>,
  HanCountQuestionState
>({
  slug: "han-count",
  maxWidth: "max-w-2xl",
  useBoardState: () => useGeneratedScoreQuestion(),
  // 出題の生成待ちは進める先が無いためスキップさせない
  skipOf: ({ question, advanceQuestion }) =>
    question === undefined ? undefined : advanceQuestion,
  renderBoard: ({ showFeedback, onAnswer }, _props, questionState) => (
    <HanCountBoard
      {...questionState}
      showFeedback={showFeedback}
      onAnswer={onAnswer}
    />
  ),
});
