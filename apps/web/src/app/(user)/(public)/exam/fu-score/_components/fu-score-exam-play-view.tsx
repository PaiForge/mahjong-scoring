"use client";

import { createChallengePlayView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { FuScoreExamBoard } from "./fu-score-exam-board";
import type { FuScoreExamQuestionResult } from "../_lib/types";

/**
 * 昇級試験（30〜50符の点数計算）本体
 * 昇級試験ドリル
 */
export const FuScoreExamPlayView =
  createChallengePlayView<FuScoreExamQuestionResult>({
    slug: "fu-score-exam",
    maxWidth: "max-w-lg",
    renderBoard: (args) => (
      <FuScoreExamBoard
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
      />
    ),
  });
