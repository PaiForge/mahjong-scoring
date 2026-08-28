"use client";

import { useCallback, useState } from "react";

import type { PracticeBoardProps } from "../_lib/practice-board-props";
import { useClientGeneratedQuestion } from "./use-client-generated-question";
import { useTrainingReveal } from "./use-training-reveal";

/** 符を答える練習の問題が満たすべき最小の形 */
interface FuQuestion {
  readonly answer: number;
}

interface UseFuChoiceBoardParams<TQuestion extends FuQuestion> extends Pick<
  PracticeBoardProps,
  "showFeedback" | "onAnswer"
> {
  /** 問題を 1 問生成する */
  readonly generateQuestion: () => TQuestion;
  /** 選択肢として並べる符（インデックスで選択される） */
  readonly options: readonly number[];
  /**
   * 回答を記録する（チャレンジの結果ページの問題別一覧用）
   *
   * そのとき出ていた問題と、選ばれた符を受け取る。記録しない練習と
   * トレーニングでは渡らない。
   */
  readonly onRecordResult?: (question: TQuestion, fu: number) => void;
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
export function useFuChoiceBoard<TQuestion extends FuQuestion>({
  generateQuestion,
  options,
  showFeedback,
  onAnswer,
  onRecordResult,
}: UseFuChoiceBoardParams<TQuestion>): UseFuChoiceBoardResult<TQuestion> {
  const [question, setQuestion] = useClientGeneratedQuestion(generateQuestion);
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedFu(undefined);
  }, [generateQuestion, setQuestion]);

  useTrainingReveal(question === undefined ? undefined : advanceQuestion);

  const handleSelect = useCallback(
    (index: number) => {
      if (showFeedback || !question) return;
      const fu = options[index];
      setSelectedFu(fu);
      onRecordResult?.(question, fu);
      onAnswer(fu === question.answer, advanceQuestion);
    },
    [
      showFeedback,
      options,
      onAnswer,
      question,
      advanceQuestion,
      onRecordResult,
    ],
  );

  return { question, selectedFu, handleSelect };
}
