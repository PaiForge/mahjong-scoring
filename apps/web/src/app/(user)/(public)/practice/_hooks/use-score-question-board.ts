"use client";

import { useCallback } from "react";
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
import { toScoreQuestionSnapshot } from "../_lib/score-question-result";
import { paymentToScoreTableAnswer } from "../_lib/payment-adapter";
import type { RecordingPracticeBoardProps } from "../_lib/practice-board-props";
import { useGeneratedScoreQuestion } from "./use-generated-score-question";
import { useRegisterAdvance } from "./use-training-mode";

type GenerateOptions = Parameters<typeof generateValidScoreQuestion>[0];

export interface UseScoreQuestionBoardParams extends Pick<
  RecordingPracticeBoardProps<ScoreQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult"
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
}: UseScoreQuestionBoardParams): UseScoreQuestionBoardResult {
  const { question, questionIndex, advanceQuestion } =
    useGeneratedScoreQuestion(generateOptions, maxRetries);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);

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
        // 「26翻 → 役満」のような役満止まりの注記に使う
        yakumanMultiplier: question.answer.yakumanMultiplier,
        // 結果ページで出題内容（手牌・ドラ）を再表示するために保存する
        question: toScoreQuestionSnapshot(question),
      });

      onAnswer(isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  return { question, questionIndex, handleSubmit };
}
