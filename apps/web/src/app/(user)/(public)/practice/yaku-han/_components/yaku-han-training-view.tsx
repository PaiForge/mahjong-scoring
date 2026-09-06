"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { Suspense } from "react";

import { createTrainingView } from "../../_lib/create-challenge-views";
import type { TrainingBoardArgs } from "../../_lib/create-challenge-views";
import { YakuHanBoard } from "./yaku-han-board";
import { YakuHanGeneratingPlaceholder } from "./yaku-han-generating-placeholder";
import { useVariantQuery } from "../../_hooks/use-variant-query";
import { YAKU_HAN_VARIANT_RANGES } from "../_lib/variants";

/** URL のバリアント（出題範囲）で盤面を描く（{@link YakuHanPlayView} と同じ理由で境界の内側） */
function YakuHanBoardFromQuery({ args }: { readonly args: TrainingBoardArgs }) {
  const range = YAKU_HAN_VARIANT_RANGES[useVariantQuery(PRACTICE_SLUG.yakuHan)];

  return (
    <YakuHanBoard
      showFeedback={args.showFeedback}
      range={range}
      onAnswer={args.onAnswer}
    />
  );
}

export const YakuHanTrainingView = createTrainingView({
  slug: PRACTICE_SLUG.yakuHan,
  maxWidth: "max-w-2xl",
  renderBoard: (args) => (
    <Suspense fallback={<YakuHanGeneratingPlaceholder />}>
      <YakuHanBoardFromQuery args={args} />
    </Suspense>
  ),
});
