"use client";

import { useCallback } from "react";
import { tehaiContextOf } from "../../_lib/score-question-context";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useTranslations } from "next-intl";
import { useGeneratedScoreQuestion } from "../../_hooks/use-generated-score-question";
import { TehaiDisplay } from "../../_components/tehai-display";
import { HanCountAnswerForm } from "./han-count-answer-form";
import type { HanCountQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

type HanCountBoardProps = RecordingPracticeBoardProps<HanCountQuestionResult>;

/**
 * 翻数即答の出題盤面（手牌の提示と翻数入力）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function HanCountBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
}: HanCountBoardProps) {
  const t = useTranslations("hanCountChallenge");
  const { question, questionIndex, advanceQuestion } =
    useGeneratedScoreQuestion();

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback || !question) return;

      const correctHan = question.answer.han;
      const isCorrect = userHan === correctHan;

      onRecordResult?.({ correctHan, userHan, isCorrect });
      onAnswer(isCorrect, advanceQuestion);
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
        translationNamespace="hanCountChallenge"
      />

      {/* Answer form */}
      <HanCountAnswerForm
        correctHan={question.answer.han}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
