"use client";

import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import { Suspense } from "react";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { ChallengeBoardArgs } from "@mahjong-scoring/features/practice/board-props";
import type { TotalFuQuestionResult } from "@mahjong-scoring/features/practice/total-fu/types";
import { TOTAL_FU_VARIANT_RANGES } from "@mahjong-scoring/features/practice/total-fu/variants";
import { useVariantQuery } from "../../_hooks/use-variant-query";
import { TotalFuBoard } from "./total-fu-board";
import { TotalFuGeneratingPlaceholder } from "./total-fu-generating-placeholder";

/**
 * URL のバリアント（出題範囲）で盤面を描く
 *
 * バリアントを `useSearchParams()` で読むため、静的ルートではこのサブツリーだけが
 * クライアント描画になる。シェル（タイトル・タイマー・ライフ）は
 * プリレンダーされたまま残る。
 */
function TotalFuBoardFromQuery({
  args,
}: {
  readonly args: ChallengeBoardArgs<TotalFuQuestionResult>;
}) {
  const range = TOTAL_FU_VARIANT_RANGES[useVariantQuery(PRACTICE_SLUG.totalFu)];

  // onProceed は渡さない。チャレンジ中は符の内訳を出さず、結果ページで振り返る。
  return (
    <TotalFuBoard
      range={range}
      showFeedback={args.showFeedback}
      isCountingDown={args.isCountingDown}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
      onPresentQuestion={args.presentQuestion}
    />
  );
}

/**
 * 合計符練習本体
 * 合計符練習
 */
export const TotalFuPlayView = createChallengePlayView<TotalFuQuestionResult>({
  slug: PRACTICE_SLUG.totalFu,
  maxWidth: "max-w-lg",
  renderBoard: (args) => (
    <Suspense fallback={<TotalFuGeneratingPlaceholder />}>
      <TotalFuBoardFromQuery args={args} />
    </Suspense>
  ),
});
