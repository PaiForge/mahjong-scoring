"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { ScoreCalculationBoard } from "./score-calculation-board";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

export const ScoreCalculationPlayView =
  createChallengePlayView<ScoreCalculationQuestionResult>({
    namespace: "scoreCalculationChallenge",
    menuType: "score_calculation",
    slug: "score-calculation",
    maxWidth: "max-w-lg",
    resultStorageKey: RESULT_STORAGE_KEY,
    renderBoard: ({
      showFeedback,
      isCountingDown,
      lastAnswerCorrect,
      onAnswer,
      recordResult,
    }) => (
      <ScoreCalculationBoard
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        lastAnswerCorrect={lastAnswerCorrect}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
      />
    ),
  });
