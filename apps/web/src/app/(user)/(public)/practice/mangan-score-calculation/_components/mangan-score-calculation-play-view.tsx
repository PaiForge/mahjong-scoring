"use client";

import { useSearchParams } from "next/navigation";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";
import type { ManganScoreCalculationQuestionResult } from "../_lib/types";
import { parsePlayerType } from "../_lib/types";
import type { PlayerType } from "../_lib/types";

/**
 * 満貫以上点数計算ドリル本体
 * 満貫以上点数計算ドリル
 */
export const ManganScoreCalculationPlayView = createChallengePlayView<
  ManganScoreCalculationQuestionResult,
  Record<string, never>,
  PlayerType
>({
  slug: "mangan-score-calculation",
  maxWidth: "max-w-lg",
  useBoardState: () => {
    const searchParams = useSearchParams();
    return parsePlayerType(searchParams.get("player") ?? undefined);
  },
  renderBoard: (args, _props, playerType) => (
    <ManganScoreCalculationBoard
      playerType={playerType}
      showFeedback={args.showFeedback}
      lastAnswerCorrect={args.lastAnswerCorrect}
      isCountingDown={args.isCountingDown}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
    />
  ),
});
