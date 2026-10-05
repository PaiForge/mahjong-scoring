import { useCallback, useState } from "react";

import type { PracticeBoardProps } from "../board-props";
import { useGeneratedQuestion } from "./use-generated-question";
import { usePresentQuestion } from "./use-present-question";
import { useRegisterAdvance } from "@mahjong-scoring/features/practice/use-training-mode";

function identity<T>(value: T): T {
  return value;
}

interface FuQuestion {
  readonly answer: number;
}

/**
 * 符を選択肢から選ぶ盤面の出題・回答
 * 符選択盤面
 *
 * web の `useFuChoiceBoard` の移植。出題・選択・次の問題への切り替えを持ち、
 * 盤面は描画だけをする。`generateQuestion` が undefined を返す（出題の生成に
 * 失敗した）ときは問題が無いまま。
 */
export function useFuChoiceBoard<TQuestion extends FuQuestion>({
  generateQuestion,
  options,
  showFeedback,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: Pick<PracticeBoardProps, "showFeedback" | "onAnswer"> & {
  readonly generateQuestion: () => TQuestion | undefined;
  readonly options: readonly number[];
  readonly onRecordResult?: (question: TQuestion, fu: number) => void;
  readonly onPresentQuestion?: (question: TQuestion) => void;
}): {
  readonly question: TQuestion | undefined;
  readonly selectedFu: number | undefined;
  readonly handleSelect: (index: number) => void;
} {
  const [question, nextQuestion] = useGeneratedQuestion(generateQuestion);
  const [selectedFu, setSelectedFu] = useState<number | undefined>(undefined);

  usePresentQuestion(question, identity, onPresentQuestion);

  const advanceQuestion = useCallback(() => {
    nextQuestion();
    setSelectedFu(undefined);
  }, [nextQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);

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
