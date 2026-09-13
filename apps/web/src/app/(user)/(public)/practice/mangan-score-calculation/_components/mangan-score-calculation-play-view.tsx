"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";
import type { ManganScoreCalculationQuestionResult } from "../_lib/types";

/**
 * 満貫以上の点数計算 本体
 * 満貫以上の点数計算
 */
export const ManganScoreCalculationPlayView =
  createChallengePlayView<ManganScoreCalculationQuestionResult>({
    slug: PRACTICE_SLUG.manganScoreCalculation,
    maxWidth: "max-w-lg",
    renderBoard: (args) => (
      <ManganScoreCalculationBoard
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
      />
    ),
  });
