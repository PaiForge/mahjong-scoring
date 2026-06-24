"use client";

import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { ScoreTableBoard } from "./score-table-board";

export function ScoreTableTrainingView() {
  const t = useTranslations("scoreTableChallenge");
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
      exitHref="/practice/score-table"
    >
      <ScoreTableBoard
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        onAnswer={handleAnswer}
      />
    </TrainingShell>
  );
}
