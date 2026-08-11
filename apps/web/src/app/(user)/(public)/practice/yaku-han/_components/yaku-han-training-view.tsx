"use client";

import { normalizeYakuHanRange } from "@mahjong-scoring/core";

import { createTrainingView } from "../../_lib/create-challenge-views";
import { YakuHanBoard } from "./yaku-han-board";

interface YakuHanTrainingViewProps {
  /** 出題範囲（URL の range クエリ。不正値・未指定は全役にフォールバック） */
  readonly range?: string;
}

export const YakuHanTrainingView = createTrainingView<YakuHanTrainingViewProps>(
  {
    namespace: "yakuHanChallenge",
    slug: "yaku-han",
    maxWidth: "max-w-2xl",
    renderBoard: (args, { range }) => (
      <YakuHanBoard
        showFeedback={args.showFeedback}
        range={normalizeYakuHanRange(range)}
        onAnswer={args.onAnswer}
      />
    ),
  },
);
