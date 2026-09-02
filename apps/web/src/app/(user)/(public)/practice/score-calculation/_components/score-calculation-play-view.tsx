"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { ScoreCalculationBoard } from "./score-calculation-board";
import type { ScoreCalculationQuestionResult } from "../_lib/types";

export const ScoreCalculationPlayView =
  createChallengePlayView<ScoreCalculationQuestionResult>({
    slug: "score-calculation",
    maxWidth: "max-w-lg",
    renderBoard: ({
      showFeedback,
      lastAnswerCorrect,
      isCountingDown,
      onAnswer,
      recordResult,
    }) => (
      <ScoreCalculationBoard
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        isCountingDown={isCountingDown}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
      />
    ),
  });
