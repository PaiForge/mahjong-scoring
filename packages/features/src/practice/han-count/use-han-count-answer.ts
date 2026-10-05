"use client";

import { clampHanToYakuman } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import type { RecordingPracticeBoardProps } from "../board-props";
import { useQuestionAnswer } from "../use-question-answer";
import { useTrainingMode } from "../use-training-mode";
import { toHanCountQuestionResult, type HanCountQuestionResult } from "./types";

interface UseHanCountAnswerResult {
  readonly handleSubmit: (userHan: number) => void;
  /**
   * 正解の翻数（役満に丸めたもの）。選択肢が 1〜13 のため、正解の提示
   * （ハイライト・内訳の注記）も丸めた翻数で行う
   */
  readonly correctHan: number;
  /**
   * 翻数の内訳を出すか。トレーニングでは開示時も回答後の停止中も出す
   * （どちらも答え合わせの局面）。チャレンジには出さない
   */
  readonly showBreakdown: boolean;
}

/**
 * 翻数即答の回答処理
 * 翻数即答回答
 *
 * 出題状態（`useGeneratedScoreQuestion`）は web ではビューが持って盤面へ渡し、
 * モバイルでは盤面が持つ。どちらもここで採点・記録と答え合わせの判定を行う。
 * 14翻以上（役満+ドラ・ダブル役満等）の正解は役満（13翻）に丸めて判定・記録する
 * （`toHanCountQuestionResult` が丸める）。丸めないと正解できない問題になる。
 */
export function useHanCountAnswer({
  question,
  advanceQuestion,
  ...handlers
}: Pick<
  RecordingPracticeBoardProps<HanCountQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> & {
  readonly question: ScoreQuestion | undefined;
  readonly advanceQuestion: () => void;
}): UseHanCountAnswerResult {
  const handleSubmit = useQuestionAnswer({
    question,
    advanceQuestion,
    toResult: toHanCountQuestionResult,
    ...handlers,
  });
  const { isRevealed, isHolding } = useTrainingMode();

  return {
    handleSubmit,
    correctHan:
      question === undefined ? 0 : clampHanToYakuman(question.answer.han),
    showBreakdown: isRevealed || isHolding,
  };
}
