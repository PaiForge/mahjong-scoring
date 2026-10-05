"use client";

import { useCallback } from "react";
import type { AnswerOutcome } from "../results/result-schemas";
import type { RecordingPracticeBoardProps } from "./board-props";
import { useGradeAndRecord } from "./use-grade-answer";
import { usePresentQuestion } from "./use-present-question";
import { useRegisterAdvance } from "./use-training-mode";

/**
 * 1 問の回答を結果に組む関数
 *
 * 回答が無い（時間切れ）ときは `undefined` で呼ばれ、回答なしの結果を組む。
 * 参照が変わるたびに届け直すため、モジュール定数か `useCallback` で安定させること。
 */
export type ToQuestionResult<TQuestion, TAnswer, TResult> = (
  question: TQuestion,
  answer: TAnswer | undefined,
) => TResult;

export interface UseQuestionAnswerParams<
  TQuestion,
  TAnswer,
  TResult extends { readonly outcome: AnswerOutcome },
> extends Pick<
  RecordingPracticeBoardProps<TResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> {
  /** 出題中の問題。生成待ちは undefined */
  readonly question: TQuestion | undefined;
  /** 次の問題へ差し替える */
  readonly advanceQuestion: () => void;
  readonly toResult: ToQuestionResult<TQuestion, TAnswer, TResult>;
}

/**
 * 1 問ずつ答える盤面の回答処理
 * 回答処理
 *
 * 出題中の問題について、次問への操作の登録（トレーニングの「次の問題へ」）、
 * 時間切れ用の届け出、回答の採点と結果の記録をまとめる。出題状態は呼び出し側が
 * 持つ（{@link import("./use-question-board").useQuestionBoard} が典型）。
 *
 * @returns 回答を採点に回す。答え合わせの表示中と問題の生成待ちは何もしない
 */
export function useQuestionAnswer<
  TQuestion,
  TAnswer,
  TResult extends { readonly outcome: AnswerOutcome },
>({
  question,
  advanceQuestion,
  toResult,
  showFeedback,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: UseQuestionAnswerParams<TQuestion, TAnswer, TResult>): (
  answer: TAnswer,
) => void {
  const toUnanswered = useCallback(
    (unanswered: TQuestion) => toResult(unanswered, undefined),
    [toResult],
  );
  const gradeAndRecord = useGradeAndRecord<TQuestion, TAnswer, TResult>(
    toResult,
    { onRecordResult, onAnswer, advance: advanceQuestion },
  );

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnanswered, onPresentQuestion);

  return useCallback(
    (answer: TAnswer) => {
      if (showFeedback || question === undefined) return;
      gradeAndRecord(question, answer);
    },
    [showFeedback, question, gradeAndRecord],
  );
}
