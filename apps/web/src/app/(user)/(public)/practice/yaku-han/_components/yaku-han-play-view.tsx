"use client";

import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { Suspense } from "react";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { ChallengeBoardArgs } from "../../_lib/create-challenge-views";
import { YakuHanBoard } from "./yaku-han-board";
import { YakuHanGeneratingPlaceholder } from "./yaku-han-generating-placeholder";
import { useVariantQuery } from "../../_hooks/use-variant-query";
import { YAKU_HAN_VARIANT_RANGES } from "../_lib/variants";
import type { YakuHanQuestionResult } from "../_lib/types";

/**
 * URL のバリアント（出題範囲）で盤面を描く
 *
 * バリアントを `useSearchParams()` で読むため、静的ルートではこのサブツリーだけが
 * クライアント描画になる。シェル（タイトル・タイマー・ライフ）は
 * プリレンダーされたまま残る。
 */
function YakuHanBoardFromQuery({
  args,
}: {
  readonly args: ChallengeBoardArgs<YakuHanQuestionResult>;
}) {
  const range = YAKU_HAN_VARIANT_RANGES[useVariantQuery(PRACTICE_SLUG.yakuHan)];

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
  slug: PRACTICE_SLUG.yakuHan,
  maxWidth: "max-w-2xl",
  renderBoard: (args) => (
    <Suspense fallback={<YakuHanGeneratingPlaceholder />}>
      <YakuHanBoardFromQuery args={args} />
    </Suspense>
  ),
});
