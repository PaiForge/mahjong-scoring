"use client";

import { createChallengePlayView } from "@/app/(user)/(public)/practice/_lib/create-challenge-views";
import { ScoreExamBoard } from "./score-exam-board";
import type { ScoreExamQuestionResult } from "../_lib/types";

/**
 * 昇段試験（あらゆる手の点数計算）本体
 * 昇段試験ドリル
 */
export const ScoreExamPlayView =
  createChallengePlayView<ScoreExamQuestionResult>({
    slug: "score-exam",
    maxWidth: "max-w-lg",
    renderBoard: (args) => (
      <ScoreExamBoard
        showFeedback={args.showFeedback}
        lastAnswerCorrect={args.lastAnswerCorrect}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
      />
    ),
  });
