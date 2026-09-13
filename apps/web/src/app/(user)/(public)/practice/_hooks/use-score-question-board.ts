"use client";

import { useCallback } from "react";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import type { ScoreQuestionResult } from "../_lib/score-question-result";
import { toScoreQuestionResult } from "../_lib/score-question-result";
import { AnswerOutcome } from "../_lib/result-schemas";
import type { RecordingPracticeBoardProps } from "../_lib/practice-board-props";
import { useGeneratedScoreQuestion } from "./use-generated-score-question";
import { usePresentQuestion } from "./use-present-question";
import { useRegisterAdvance } from "./use-training-mode";

type GenerateOptions = Parameters<typeof generateValidScoreQuestion>[0];

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(question: ScoreQuestion): ScoreQuestionResult {
  return toScoreQuestionResult(question, undefined);
}

export interface UseScoreQuestionBoardParams extends Pick<
  RecordingPracticeBoardProps<ScoreQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> {
  /** 出題オプション（再生成のたびに使用するため安定参照を渡すこと） */
  readonly generateOptions: GenerateOptions;
  /** 生成の最大試行回数（{@link useGeneratedScoreQuestion} の同名引数へそのまま渡す） */
  readonly maxRetries?: number;
}

interface UseScoreQuestionBoardResult {
  readonly question: ScoreQuestion | undefined;
  readonly questionIndex: number;
  readonly handleSubmit: (userAnswer: ScoreTableUserAnswer) => void;
}

/**
 * 点数計算系の出題状態と回答ロジックを管理するフック
 * 点数出題ボード
 *
 * 出題（generateValidScoreQuestion）・次問への遷移・回答判定（judgeScoreTableAnswer）
 * と結果記録を内包し、score-calculation / mangan-score-calculation の盤面で共有する。
 * 出題条件の違いは `generateOptions` で吸収する。
 */
export function useScoreQuestionBoard({
  generateOptions,
  maxRetries,
  showFeedback,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: UseScoreQuestionBoardParams): UseScoreQuestionBoardResult {
  const { question, questionIndex, advanceQuestion } =
    useGeneratedScoreQuestion(generateOptions, maxRetries);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback || !question) return;

      const result = toScoreQuestionResult(question, userAnswer);
      onRecordResult?.(result);
      onAnswer(result.outcome === AnswerOutcome.Correct, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  return { question, questionIndex, handleSubmit };
}
