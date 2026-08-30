"use client";

import { createChallengePlayView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { ChiitoitsuExamBoard } from "./chiitoitsu-exam-board";
import type { ChiitoitsuExamQuestionResult } from "../_lib/types";

/**
 * 昇級試験（七対子の点数計算）本体
 * 昇級試験ドリル
 */
export const ChiitoitsuExamPlayView =
  createChallengePlayView<ChiitoitsuExamQuestionResult>({
    slug: "chiitoitsu-exam",
    maxWidth: "max-w-lg",
    renderBoard: (args) => (
      <ChiitoitsuExamBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
      />
    ),
  });
