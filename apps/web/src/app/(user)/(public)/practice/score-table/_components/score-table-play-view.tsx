"use client";

import { Suspense } from "react";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import type { ChallengeBoardArgs } from "../../_lib/create-challenge-views";
import { ScoreTableBoard } from "./score-table-board";
import { ScoreTableGeneratingPlaceholder } from "./score-table-generating-placeholder";
import { useScoreTableGeneratorOptions } from "../_hooks/use-score-table-query-selection";
import { useScoreTableQuestion } from "../_hooks/use-score-table-question";
import type { ScoreTableQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

/**
 * URL の出題条件で盤面を描く
 *
 * 条件を `useSearchParams()` で読むため、静的ルートではこのサブツリーだけが
 * クライアント描画になる。シェル（タイトル・タイマー・ライフ）は
 * プリレンダーされたまま残る。
 */
function ScoreTableBoardFromQuery({
  args,
}: {
  readonly args: ChallengeBoardArgs<ScoreTableQuestionResult>;
}) {
  const generatorOptions = useScoreTableGeneratorOptions();
  const { question, advance } = useScoreTableQuestion(generatorOptions);

  return (
    <ScoreTableBoard
      question={question}
      onAdvance={advance}
      showFeedback={args.showFeedback}
      isCountingDown={args.isCountingDown}
      lastAnswerCorrect={args.lastAnswerCorrect}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
    />
  );
}

/**
 * 点数表早引き練習本体
 * 点数表練習
 */
export const ScoreTablePlayView = createChallengePlayView<
  ScoreTableQuestionResult,
  Record<string, never>
>({
  slug: "score-table",
  resultStorageKey: RESULT_STORAGE_KEY,
  renderBoard: (args) => (
    <Suspense fallback={<ScoreTableGeneratingPlaceholder />}>
      <ScoreTableBoardFromQuery args={args} />
    </Suspense>
  ),
});
