"use client";

import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { Suspense } from "react";

import { createTrainingView } from "../../_lib/create-challenge-views";
import type { TrainingBoardArgs } from "@mahjong-scoring/features/practice/board-props";
import { TOTAL_FU_VARIANT_RANGES } from "@mahjong-scoring/features/practice/total-fu/variants";
import { useVariantQuery } from "../../_hooks/use-variant-query";
import { TotalFuBoard } from "./total-fu-board";
import { TotalFuGeneratingPlaceholder } from "./total-fu-generating-placeholder";

/** URL のバリアント（出題範囲）で盤面を描く（{@link TotalFuPlayView} と同じ理由で境界の内側） */
function TotalFuBoardFromQuery({ args }: { readonly args: TrainingBoardArgs }) {
  const range = TOTAL_FU_VARIANT_RANGES[useVariantQuery(PRACTICE_SLUG.totalFu)];

  return (
    <TotalFuBoard
      range={range}
      showFeedback={args.showFeedback}
      isTraining={args.isTraining}
      onAnswer={args.onAnswer}
    />
  );
}

export const TotalFuTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.totalFu,
  maxWidth: "max-w-lg",
  renderBoard: (args) => (
    <Suspense fallback={<TotalFuGeneratingPlaceholder />}>
      <TotalFuBoardFromQuery args={args} />
    </Suspense>
  ),
});
