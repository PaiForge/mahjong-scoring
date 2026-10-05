import { useCallback, useState } from "react";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";
import {
  toScoreQuestionResult,
  type ScoreQuestionResult,
} from "@mahjong-scoring/features/results/score-question-result";

import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { useGeneratedQuestion } from "./use-generated-question";
import { usePresentQuestion } from "./use-present-question";
import { useRegisterAdvance } from "@mahjong-scoring/features/practice/use-training-mode";

/** 点数計算の出題オプション */
export type ScoreQuestionGenerateOptions = Parameters<
  typeof generateValidScoreQuestion
>[0];

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(question: ScoreQuestion): ScoreQuestionResult {
  return toScoreQuestionResult(question, undefined);
}

export interface UseScoreQuestionBoardParams extends Pick<
  RecordingPracticeBoardProps<ScoreQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> {
  /** 出題オプション（再生成のたびに使用するため安定参照を渡すこと） */
  readonly generateOptions: ScoreQuestionGenerateOptions;
  /**
   * 生成の最大試行回数（未指定時は `generateValidScoreQuestion` の既定値）。
   * 出題条件が厳しく生成成功率が低い出題（`minHan` 指定の試験等）は大きめに渡す
   */
  readonly maxRetries?: number;
}

interface UseScoreQuestionBoardResult {
  readonly question: ScoreQuestion | undefined;
  /** 出題番号（回答フォームを問題ごとに作り直す `key`） */
  readonly questionIndex: number;
  readonly handleSubmit: (userAnswer: ScoreTableUserAnswer) => void;
}

/**
 * 点数計算系の出題状態と回答ロジックを管理するフック
 * 点数出題ボード
 *
 * web の `useScoreQuestionBoard`（と `useGeneratedScoreQuestion`）の移植。
 * 出題・次問への遷移・回答判定と結果記録を内包し、点数即答・満貫以上の
 * 点数計算の盤面で共有する。出題条件の違いは `generateOptions` で吸収する。
 * モバイルはサーバー採点を持たないので、その場で採点して `onAnswer` を呼ぶ。
 */
export function useScoreQuestionBoard({
  generateOptions,
  maxRetries,
  showFeedback,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: UseScoreQuestionBoardParams): UseScoreQuestionBoardResult {
  const generate = useCallback(
    (): ScoreQuestion | undefined =>
      generateValidScoreQuestion(generateOptions, maxRetries) ?? undefined,
    [generateOptions, maxRetries],
  );
  const [question, nextQuestion] = useGeneratedQuestion(generate);
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    nextQuestion();
    setQuestionIndex((prev) => prev + 1);
  }, [nextQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback || !question) return;
      const result = toScoreQuestionResult(question, userAnswer);
      onRecordResult?.(result);
      onAnswer(result.outcome === AnswerOutcome.Correct, advanceQuestion);
    },
    [showFeedback, question, onRecordResult, onAnswer, advanceQuestion],
  );

  return { question, questionIndex, handleSubmit };
}
