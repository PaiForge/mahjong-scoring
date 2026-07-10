"use client";

import { useCallback, useState } from "react";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";

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
  const [question, setQuestion] = useState<ScoreQuestion | undefined>(
    () => generateValidScoreQuestion(generateOptions) ?? undefined,
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateValidScoreQuestion(generateOptions) ?? undefined);
    setQuestionIndex((prev) => prev + 1);
  }, [generateOptions]);

  return { question, questionIndex, advanceQuestion };
}
