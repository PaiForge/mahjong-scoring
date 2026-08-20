"use client";

import { useCallback, useState } from "react";

/** 符を答える練習の問題が満たすべき最小の形 */
interface FuQuestion {
  readonly answer: number;
}

interface UseFuChoiceBoardParams<TQuestion extends FuQuestion> {
  /** 問題を 1 問生成する */
  readonly generateQuestion: () => TQuestion;
  /** 選択肢として並べる符（インデックスで選択される） */
  readonly options: readonly number[];
  readonly showFeedback: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
}

interface UseFuChoiceBoardResult<TQuestion extends FuQuestion> {
  readonly question: TQuestion;
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
}: UseFuChoiceBoardParams<TQuestion>): UseFuChoiceBoardResult<TQuestion> {
  const [question, setQuestion] = useState<TQuestion>(generateQuestion);
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedFu(undefined);
  }, [generateQuestion]);

  const handleSelect = useCallback(
    (index: number) => {
      if (showFeedback) return;
      const fu = options[index];
      setSelectedFu(fu);
      onAnswer(fu === question.answer, advanceQuestion);
    },
    [showFeedback, options, onAnswer, question.answer, advanceQuestion],
  );

  return { question, selectedFu, handleSelect };
}
