"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { ScoreCalculationBoard } from "./score-calculation-board";
import type { ScoreCalculationQuestionResult } from "../_lib/types";

export const ScoreCalculationPlayView =
  createChallengePlayView<ScoreCalculationQuestionResult>({
    slug: PRACTICE_SLUG.scoreCalculation,
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
