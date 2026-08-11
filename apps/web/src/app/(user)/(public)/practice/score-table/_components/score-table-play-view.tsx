"use client";

import type { ScoreTableGeneratorOptions } from "@mahjong-scoring/core";

import { createChallengePlayView } from "../../_lib/create-challenge-views";
import { ScoreTableBoard } from "./score-table-board";
import { useScoreTableQuestion } from "../_hooks/use-score-table-question";
import type { ScoreTableQuestionResult } from "../_lib/types";
import { RESULT_STORAGE_KEY } from "../_lib/types";

interface ScoreTablePlayViewProps {
  readonly generatorOptions?: ScoreTableGeneratorOptions;
}

/**
 * 点数表早引き練習本体
 * 点数表練習
 */
export const ScoreTablePlayView = createChallengePlayView<
  ScoreTableQuestionResult,
  ScoreTablePlayViewProps,
  ReturnType<typeof useScoreTableQuestion>
>({
  slug: "score-table",
  resultStorageKey: RESULT_STORAGE_KEY,
  useBoardState: ({ generatorOptions }) =>
    useScoreTableQuestion(generatorOptions),
  renderBoard: (args, _props, { question, advance }) => (
    <ScoreTableBoard
      question={question}
      onAdvance={advance}
      showFeedback={args.showFeedback}
      isCountingDown={args.isCountingDown}
      lastAnswerCorrect={args.lastAnswerCorrect}
      onAnswer={args.onAnswer}
      onRecordResult={args.recordResult}
    />
  ),
});
