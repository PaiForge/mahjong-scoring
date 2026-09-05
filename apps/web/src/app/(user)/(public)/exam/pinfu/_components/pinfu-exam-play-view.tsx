"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { createChallengePlayView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { PinfuExamBoard } from "./pinfu-exam-board";
import type { PinfuExamQuestionResult } from "../_lib/types";

/**
 * 昇級試験（平和の点数計算）本体
 * 昇級試験ドリル
 */
export const PinfuExamPlayView =
  createChallengePlayView<PinfuExamQuestionResult>({
    slug: PRACTICE_SLUG.pinfuExam,
    maxWidth: "max-w-lg",
    renderBoard: (args) => (
      <PinfuExamBoard
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
      />
    ),
  });
