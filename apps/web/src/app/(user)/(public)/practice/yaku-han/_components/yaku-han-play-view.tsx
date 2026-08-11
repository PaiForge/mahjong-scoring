"use client";

import { normalizeYakuHanRange } from "@mahjong-scoring/core";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { YakuHanBoard } from "./yaku-han-board";
import type { YakuHanQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

interface YakuHanPlayViewProps {
  /** 出題範囲（URL の range クエリ。不正値・未指定は全役にフォールバック） */
  readonly range?: string;
}

/**
 * 役翻数練習本体
 * 役翻数練習
 */
export const YakuHanPlayView = createChallengePlayView<
  YakuHanQuestionResult,
  YakuHanPlayViewProps
>({
  slug: "yaku-han",
  maxWidth: "max-w-2xl",
  resultStorageKey: RESULT_STORAGE_KEY,
  renderBoard: (args, { range }) => (
    <YakuHanBoard
      showFeedback={args.showFeedback}
      isCountingDown={args.isCountingDown}
      range={normalizeYakuHanRange(range)}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
    />
  ),
});
