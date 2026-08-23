"use client";

import { useCallback, useState } from "react";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { useClientGeneratedQuestion } from "./use-client-generated-question";

type GenerateOptions = Parameters<typeof generateValidScoreQuestion>[0];

/**
 * 点数計算問題の出題状態（現在の問題・出題番号・次問遷移）を管理するフック
 * 出題状態管理
 *
 * `generateValidScoreQuestion` による生成と次問への遷移のみを担い、
 * 回答判定は呼び出し側（各盤面）が行う。
 *
 * @param generateOptions - 出題オプション（再生成のたびに使用するため安定参照を渡すこと）
 */
export function useGeneratedScoreQuestion(generateOptions?: GenerateOptions): {
  readonly question: ScoreQuestion | undefined;
  readonly questionIndex: number;
  readonly advanceQuestion: () => void;
} {
  const generate = useCallback(
    () => generateValidScoreQuestion(generateOptions) ?? undefined,
    [generateOptions],
  );
  const [question, setQuestion] = useClientGeneratedQuestion(generate);
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generate());
    setQuestionIndex((prev) => prev + 1);
  }, [generate, setQuestion]);

  return { question, questionIndex, advanceQuestion };
}
