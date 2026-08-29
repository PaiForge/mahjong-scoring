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
  // 点数は select で答えるため選択肢の色分けで正誤を返せない。盤面を
  // フィードバック枠で囲むのをやめた代わりに、点数表早引きと同じ
  // 正解/不正解カウンタを出して回答のたびに動かす
  showScoreCounter: true,
  useBoardState: () => {
    const searchParams = useSearchParams();
    return parsePlayerType(searchParams.get("player") ?? undefined);
  },
  renderBoard: (args, _props, playerType) => (
    <ManganScoreCalculationBoard
      playerType={playerType}
      showFeedback={args.showFeedback}
      isCountingDown={args.isCountingDown}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
    />
  ),
});
