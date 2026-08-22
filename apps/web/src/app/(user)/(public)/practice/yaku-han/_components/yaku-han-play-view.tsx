"use client";

import { Suspense } from "react";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { ChallengeBoardArgs } from "../../_lib/create-challenge-views";
import { YakuHanBoard } from "./yaku-han-board";
import { YakuHanGeneratingPlaceholder } from "./yaku-han-generating-placeholder";
import { useYakuHanRangeQuery } from "../_hooks/use-yaku-han-range-query";
import type { YakuHanQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * URL の出題範囲で盤面を描く
 *
 * 範囲を `useSearchParams()` で読むため、静的ルートではこのサブツリーだけが
 * クライアント描画になる。シェル（タイトル・タイマー・ライフ）は
 * プリレンダーされたまま残る。
 */
function YakuHanBoardFromQuery({
  args,
}: {
  readonly args: ChallengeBoardArgs<YakuHanQuestionResult>;
}) {
  const range = useYakuHanRangeQuery();

  return (
    <YakuHanBoard
      showFeedback={args.showFeedback}
      isCountingDown={args.isCountingDown}
      range={range}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
    />
  );
}

/**
 * 役翻数練習本体
 * 役翻数練習
 */
export const YakuHanPlayView = createChallengePlayView<
  YakuHanQuestionResult,
  Record<string, never>
>({
  slug: "yaku-han",
  maxWidth: "max-w-2xl",
  resultStorageKey: RESULT_STORAGE_KEY,
  renderBoard: (args) => (
    <Suspense fallback={<YakuHanGeneratingPlaceholder />}>
      <YakuHanBoardFromQuery args={args} />
    </Suspense>
  ),
});
