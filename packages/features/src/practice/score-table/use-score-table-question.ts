"use client";

import { useCallback } from "react";
import { generateScoreTableQuestion } from "@mahjong-scoring/core";
import type {
  ScoreTableGeneratorOptions,
  ScoreTableQuestion,
} from "@mahjong-scoring/core";
import { generateNextScoreTableQuestion } from "./next-question";
import { useGeneratedQuestion } from "../use-generated-question";

/**
 * 点数表早引きの出題状態フック
 * 点数表出題状態
 *
 * 現在の問題と「次の問題へ進む」操作を提供する。正解開示・回答後の遷移の
 * いずれもこの `advance` を呼ぶ。最初の問題はクライアントで生成するため、
 * マウントまでは `question` が undefined になる。
 *
 * 次の問題は直前と表示が異なるものを引く（{@link generateNextScoreTableQuestion}）。
 *
 * @param generatorOptions 出題条件（親子・ツモロン・点数帯の絞り込み）
 */
export function useScoreTableQuestion(
  generatorOptions?: ScoreTableGeneratorOptions,
): { question: ScoreTableQuestion | undefined; advance: () => void } {
  const generate = useCallback(
    () => generateScoreTableQuestion(generatorOptions),
    [generatorOptions],
  );
  const [question, setQuestion] = useGeneratedQuestion(generate);

  const advance = useCallback(() => {
    setQuestion((prev) => generateNextScoreTableQuestion(prev, generate));
  }, [generate, setQuestion]);

  return { question, advance };
}
