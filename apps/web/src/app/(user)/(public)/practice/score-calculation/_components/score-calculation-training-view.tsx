"use client";

import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { ScoreCalculationBoard } from "./score-calculation-board";

export function ScoreCalculationTrainingView() {
  const t = useTranslations("scoreCalculationChallenge");
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
      exitHref="/practice/score-calculation"
      maxWidth="max-w-lg"
    >
      <ScoreCalculationBoard
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        onAnswer={handleAnswer}
      />
    </TrainingShell>
  );
}
