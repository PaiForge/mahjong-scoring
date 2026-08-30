"use client";

import { useCallback } from "react";
import { clampHanToYakuman } from "@mahjong-scoring/core";
import { tehaiContextOf } from "../../_lib/score-question-context";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useTranslations } from "next-intl";
import type { useGeneratedScoreQuestion } from "../../_hooks/use-generated-score-question";
import { TehaiDisplay } from "../../_components/tehai-display";
import { useRegisterAdvance } from "../../_hooks/use-training-mode";
import { HanCountAnswerForm } from "./han-count-answer-form";
import type { HanCountQuestionResult } from "../_lib/types";
import { toHanCountQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

/**
 * 出題状態（{@link useGeneratedScoreQuestion} の戻り値）
 *
 * チャレンジ・トレーニングどちらのビューも同じ形の状態を作って渡す。
 */
export type HanCountQuestionState = ReturnType<
  typeof useGeneratedScoreQuestion
>;

type HanCountBoardProps = RecordingPracticeBoardProps<HanCountQuestionResult> &
  HanCountQuestionState;

/**
 * 翻数即答の出題盤面（手牌の提示と翻数入力）
 *
 * 回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function HanCountBoard({
  question,
  questionIndex,
  advanceQuestion,
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: HanCountBoardProps) {
  const t = useTranslations("hanCountChallenge");

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback || !question) return;

      // 選択肢は 1〜13 のため、14翻以上（役満+ドラ・ダブル役満等）の正解は
      // 役満（13翻）に丸めて判定・記録する。丸めないと正解できない問題になる
      const result = toHanCountQuestionResult(question, userHan);

      onRecordResult?.(result);
      onAnswer(result.isCorrect, advanceQuestion);
    },
    [showFeedback, question, onAnswer, advanceQuestion, onRecordResult],
  );

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={tehaiContextOf(question)}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      {/* Answer form（正解ハイライトも丸めた翻数で行う） */}
      <HanCountAnswerForm
        correctHan={clampHanToYakuman(question.answer.han)}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
