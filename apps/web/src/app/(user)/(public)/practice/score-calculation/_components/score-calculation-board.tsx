"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { getFeedbackBorderClass } from "../../_lib/feedback-styles";
import { useScoreQuestionBoard } from "../../_hooks/use-score-question-board";
import { QuestionDisplay } from "../../score/_components/question-display";
import { ScoreCalculationAnswerForm } from "./score-calculation-answer-form";
import type { ScoreCalculationQuestionResult } from "../_lib/types";

interface ScoreCalculationBoardProps {
  readonly showFeedback: boolean;
  readonly isCountingDown?: boolean;
  /** 直前の回答が正解だったか（フィードバック枠の色分けに使用） */
  readonly lastAnswerCorrect?: boolean;
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
  /** 回答結果の記録（チャレンジの結果ページ用。トレーニングでは省略） */
  readonly onRecordResult?: (result: ScoreCalculationQuestionResult) => void;
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
  const generateOptions = useMemo(() => ({ renfonpaiAs4Fu }), [renfonpaiAs4Fu]);

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions,
    showFeedback,
    onAnswer,
    onRecordResult,
  });

  if (!question) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-surface-500">{t("generating")}</div>
      </div>
    );
  }

  const feedbackBorderClass = getFeedbackBorderClass(
    showFeedback,
    lastAnswerCorrect,
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Question display */}
      <div
        className={`rounded-xl border-2 p-2 transition-colors sm:p-4 ${feedbackBorderClass}`}
      >
        <QuestionDisplay question={question} />
      </div>

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
