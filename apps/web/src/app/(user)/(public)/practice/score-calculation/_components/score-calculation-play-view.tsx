"use client";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { ScoreCalculationBoard } from "./score-calculation-board";
import type { ScoreCalculationQuestionResult } from "../_lib/types";

export const ScoreCalculationPlayView =
  createChallengePlayView<ScoreCalculationQuestionResult>({
    slug: "score-calculation",
    maxWidth: "max-w-lg",
    // 点数は select で答えるため選択肢の色分けで正誤を返せない。盤面を
    // フィードバック枠で囲むのをやめた代わりに、点数表早引きと同じ
    // 正解/不正解カウンタを出して回答のたびに動かす
    showScoreCounter: true,
    renderBoard: ({ showFeedback, isCountingDown, onAnswer, recordResult }) => (
      <ScoreCalculationBoard
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onAnswer={onAnswer}
        onRecordResult={recordResult}
      />
    ),
  });
