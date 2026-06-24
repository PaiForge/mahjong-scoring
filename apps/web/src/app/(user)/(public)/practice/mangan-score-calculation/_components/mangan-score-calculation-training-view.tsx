"use client";

import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { ManganScoreCalculationBoard } from "./mangan-score-calculation-board";

export function ManganScoreCalculationTrainingView() {
  const t = useTranslations("manganScoreCalculationChallenge");
  const {
    correctCount,
    totalCount,
    showFeedback,
    lastAnswerCorrect,
    handleAnswer,
  } = useTrainingSession();

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref="/practice/mangan-score-calculation"
      maxWidth="max-w-lg"
    >
      <ManganScoreCalculationBoard
        playerType="random"
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        onAnswer={handleAnswer}
      />
    </TrainingShell>
  );
}
