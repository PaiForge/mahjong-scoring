"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { Suspense } from "react";

import { createTrainingView } from "../../_lib/create-challenge-views";
import type { TrainingBoardArgs } from "../../_lib/create-challenge-views";
import { YakuHanBoard } from "./yaku-han-board";
import { YakuHanGeneratingPlaceholder } from "./yaku-han-generating-placeholder";
import { useYakuHanRangeQuery } from "../_hooks/use-yaku-han-range-query";

/** URL の出題範囲で盤面を描く（{@link YakuHanPlayView} と同じ理由で境界の内側） */
function YakuHanBoardFromQuery({ args }: { readonly args: TrainingBoardArgs }) {
  const range = useYakuHanRangeQuery();

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
