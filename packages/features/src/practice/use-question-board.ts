"use client";

import { useCallback, useState } from "react";
import type { AnswerOutcome } from "../results/result-schemas";
import type { RecordingPracticeBoardProps } from "./board-props";
import { useGeneratedQuestion } from "./use-generated-question";
import {
  useQuestionAnswer,
  type ToQuestionResult,
} from "./use-question-answer";

export interface UseQuestionBoardParams<
  TQuestion,
  TAnswer,
  TResult extends { readonly outcome: AnswerOutcome },
> extends Pick<
  RecordingPracticeBoardProps<TResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> {
  /**
   * 問題を 1 問生成する。生成に失敗しうる出題は undefined を返してよく、
   * 盤面は問題が揃うまでプレースホルダを描く。出題条件に依存する場合は
   * `useCallback` で安定させること
   */
  readonly generateQuestion: () => TQuestion | undefined;
  readonly toResult: ToQuestionResult<TQuestion, TAnswer, TResult>;
}

export interface UseQuestionBoardResult<TQuestion, TAnswer> {
  /** 現在の問題。最初の問題はクライアントで生成するため、それまでは undefined */
  readonly question: TQuestion | undefined;
  /** 出題番号（回答フォームを問題ごとに作り直す `key`） */
  readonly questionIndex: number;
  /** 次の問題へ差し替える */
  readonly advanceQuestion: () => void;
  readonly handleSubmit: (answer: TAnswer) => void;
}

/**
 * 1 問ずつ答える盤面の出題状態と回答処理
 * 出題ボード
 *
 * 出題・出題番号・次問への差し替えと、採点・結果の記録（{@link useQuestionAnswer}）
 * をまとめる。答え方が「1 つの値を送る」盤面（翻数・点数など）はこれだけで足り、
 * 盤面は描画だけをする。
 */
export function useQuestionBoard<
  TQuestion,
  TAnswer,
  TResult extends { readonly outcome: AnswerOutcome },
>({
  generateQuestion,
  toResult,
  ...handlers
}: UseQuestionBoardParams<TQuestion, TAnswer, TResult>): UseQuestionBoardResult<
  TQuestion,
  TAnswer
> {
  const [question, setQuestion] = useGeneratedQuestion(generateQuestion);
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setQuestionIndex((prev) => prev + 1);
  }, [generateQuestion, setQuestion]);

  const handleSubmit = useQuestionAnswer({
    question,
    advanceQuestion,
    toResult,
    ...handlers,
  });

  return { question, questionIndex, advanceQuestion, handleSubmit };
}
