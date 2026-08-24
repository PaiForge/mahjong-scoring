"use client";

import { useMemo } from "react";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useTranslations } from "next-intl";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { FeedbackFrame } from "../../_components/feedback-frame";
import { useScoreQuestionBoard } from "../../_hooks/use-score-question-board";
import { QuestionDisplay } from "../../score/_components/question-display";
import { ScoreCalculationAnswerForm } from "./score-calculation-answer-form";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

interface ScoreCalculationBoardProps extends RecordingPracticeBoardProps<ScoreCalculationQuestionResult> {
  /** 直前の回答が正解だったか（フィードバック枠の色分けに使用） */
  readonly lastAnswerCorrect?: boolean;
}

/**
 * 点数計算の出題盤面（手牌の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 */
export function ScoreCalculationBoard({
  showFeedback,
  isCountingDown = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
}: ScoreCalculationBoardProps) {
  const t = useTranslations("scoreCalculationChallenge");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const generateOptions = useMemo(
    () => ({ renfonpaiAs4Fu, kiriageMangan }),
    [renfonpaiAs4Fu, kiriageMangan],
  );

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions,
    showFeedback,
    onAnswer,
    onRecordResult,
  });

  if (!question) {
    return <QuestionGeneratingPlaceholder label={t("generating")} />;
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Question display */}
      <FeedbackFrame
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
      >
        <QuestionDisplay question={question} />
      </FeedbackFrame>

      {/* Answer form */}
      <ScoreCalculationAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
