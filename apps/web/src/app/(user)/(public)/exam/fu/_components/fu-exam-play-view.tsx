"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createChallengePlayView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { FuExamBoard } from "./fu-exam-board";
import type { FuExamQuestionResult } from "../_lib/types";

/**
 * 昇級試験（手牌の合計符）本体
 * 昇級試験ドリル
 */
export const FuExamPlayView = createChallengePlayView<FuExamQuestionResult>({
  slug: PRACTICE_SLUG.fuExam,
  maxWidth: "max-w-lg",
  renderBoard: (args) => (
    <FuExamBoard
      showFeedback={args.showFeedback}
      isCountingDown={args.isCountingDown}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
    />
  ),
});
