"use client";

import { useGradeAnswer } from "./use-grade-answer";

import { useCallback, useState } from "react";

import type { RecordingPracticeBoardProps } from "./board-props";
import { useGeneratedQuestion } from "./use-generated-question";
import { usePresentQuestion } from "./use-present-question";
import { useRegisterAdvance } from "./use-training-mode";

/** 符を答える練習の問題が満たすべき最小の形 */
interface FuQuestion {
  readonly answer: number;
}

interface UseFuChoiceBoardParams<
  TQuestion extends FuQuestion,
  TResult,
> extends Pick<
  RecordingPracticeBoardProps<TResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> {
  /**
   * 問題を 1 問生成する。生成に失敗しうる出題（合計符など）は undefined を
   * 返してよく、盤面は問題が揃うまでプレースホルダを描く
   */
  readonly generateQuestion: () => TQuestion | undefined;
  /** 選択肢として並べる符（インデックスで選択される） */
  readonly options: readonly number[];
  /**
   * 問題と選んだ符から結果を組む（時間切れの届け出では符が undefined）。
   * 参照が変わるたびに届け直すため、モジュール定数を渡すこと
   */
  readonly toResult: (question: TQuestion, fu: number | undefined) => TResult;
}

interface UseFuChoiceBoardResult<TQuestion extends FuQuestion> {
  /** 現在の問題。最初の問題はクライアントで生成するため、それまでは undefined */
  readonly question: TQuestion | undefined;
  /** 直前に選択された符（未選択時は undefined） */
  readonly selectedFu: number | undefined;
  readonly handleSelect: (index: number) => void;
}

/**
 * 符を選択肢から答える練習の出題状態と回答ロジック
 * 符選択ボード
 *
 * 出題の保持・選択の記録・正誤判定・次問への差し替えを内包し、
 * 待ち符・面子符の盤面で共有する。出題内容の違いは generateQuestion と
 * options で吸収する。
 */
export function useFuChoiceBoard<TQuestion extends FuQuestion, TResult>({
  generateQuestion,
  options,
  toResult,
  showFeedback,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: UseFuChoiceBoardParams<
  TQuestion,
  TResult
>): UseFuChoiceBoardResult<TQuestion> {
  const gradeAnswer = useGradeAnswer<TQuestion>();
  const [question, setQuestion] = useGeneratedQuestion(generateQuestion);
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const toUnanswered = useCallback(
    (unanswered: TQuestion) => toResult(unanswered, undefined),
    [toResult],
  );
  usePresentQuestion(question, toUnanswered, onPresentQuestion);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedFu(undefined);
  }, [generateQuestion, setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);

  const handleSelect = useCallback(
    (index: number) => {
      if (showFeedback || !question) return;
      const fu = options[index];
      const accepted = gradeAnswer(question, fu, (gradedQuestion) => {
        onRecordResult?.(toResult(gradedQuestion, fu));
        onAnswer(fu === gradedQuestion.answer, advanceQuestion);
      });
      // 採点を待たずに選択を立てる（サーバー採点の待ち時間に押した印を出す）
      if (accepted) setSelectedFu(fu);
    },
    [
      showFeedback,
      options,
      onAnswer,
      question,
      advanceQuestion,
      onRecordResult,
      toResult,
      gradeAnswer,
    ],
  );

  return { question, selectedFu, handleSelect };
}
