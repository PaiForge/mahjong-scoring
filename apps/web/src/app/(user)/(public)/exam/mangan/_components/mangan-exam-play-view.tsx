"use client";

import { createChallengePlayView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { ManganExamBoard } from "./mangan-exam-board";
import type { ManganExamQuestionResult } from "../_lib/types";

/**
 * 昇級試験（満貫以上の点数計算）本体
 * 昇級試験ドリル
 */
export const ManganExamPlayView =
  createChallengePlayView<ManganExamQuestionResult>({
    slug: "mangan-exam",
    maxWidth: "max-w-lg",
    renderBoard: (args) => (
      <ManganExamBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        lastAnswerCorrect={args.lastAnswerCorrect}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
      />
    ),
  });
