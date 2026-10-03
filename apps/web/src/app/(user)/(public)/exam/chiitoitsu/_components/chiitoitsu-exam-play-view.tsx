"use client";

import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { createChallengePlayView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { ChiitoitsuExamBoard } from "./chiitoitsu-exam-board";
import type { ChiitoitsuExamQuestionResult } from "@mahjong-scoring/features/exam/chiitoitsu/types";

/**
 * 昇級試験（七対子の点数計算）本体
 * 昇級試験
 */
export const ChiitoitsuExamPlayView =
  createChallengePlayView<ChiitoitsuExamQuestionResult>({
    slug: PRACTICE_SLUG.chiitoitsuExam,
    maxWidth: "max-w-lg",
    renderBoard: (args) => (
      <ChiitoitsuExamBoard
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  });
