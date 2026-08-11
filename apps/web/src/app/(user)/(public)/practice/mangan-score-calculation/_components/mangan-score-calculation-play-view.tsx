"use client";

import { useSearchParams } from "next/navigation";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";
import type { ManganScoreCalculationQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY, parsePlayerType } from "../_lib/types";
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
  namespace: "manganScoreCalculationChallenge",
  menuType: "mangan_score_calculation",
  slug: "mangan-score-calculation",
  maxWidth: "max-w-lg",
  resultStorageKey: RESULT_STORAGE_KEY,
  useBoardState: () => {
    const searchParams = useSearchParams();
    return parsePlayerType(searchParams.get("player") ?? undefined);
  },
  renderBoard: (args, _props, playerType) => (
    <ManganScoreCalculationBoard
      playerType={playerType}
      showFeedback={args.showFeedback}
      isCountingDown={args.isCountingDown}
      lastAnswerCorrect={args.lastAnswerCorrect}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
    />
  ),
});
