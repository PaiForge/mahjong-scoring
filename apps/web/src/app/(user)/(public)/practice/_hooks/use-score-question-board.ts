"use client";

import { useCallback, useState } from "react";
import {
  generateValidScoreQuestion,
  isOya,
  judgeScoreTableAnswer,
} from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import type { ScoreQuestionResult } from "../_lib/score-question-result";
import { paymentToScoreTableAnswer } from "../_lib/payment-adapter";

type GenerateOptions = Parameters<typeof generateValidScoreQuestion>[0];

interface UseScoreQuestionBoardParams {
  /** 出題オプション（再生成のたびに使用するため安定参照を渡すこと） */
  readonly generateOptions: GenerateOptions;
  readonly showFeedback: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  readonly onRecordResult?: (result: ScoreQuestionResult) => void;
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
  showFeedback,
  onAnswer,
  onRecordResult,
}: UseScoreQuestionBoardParams): UseScoreQuestionBoardResult {
  const [question, setQuestion] = useState<ScoreQuestion | undefined>(
    () => generateValidScoreQuestion(generateOptions) ?? undefined,
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateValidScoreQuestion(generateOptions) ?? undefined);
    setQuestionIndex((prev) => prev + 1);
  }, [generateOptions]);

  const handleSubmit = useCallback(
    (userAnswer: ScoreTableUserAnswer) => {
      if (showFeedback || !question) return;

      const correctAnswer = paymentToScoreTableAnswer(question.answer.payment);
      const isCorrect = judgeScoreTableAnswer(userAnswer, correctAnswer);

      onRecordResult?.({
        isOya: isOya(question.jikaze),
        isTsumo: question.isTsumo,
        han: question.answer.han,
        fu: question.answer.fu,
        correctAnswer,
        userAnswer,
        isCorrect,
      });

      onAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  return { question, questionIndex, handleSubmit };
}
