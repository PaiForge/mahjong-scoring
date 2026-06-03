"use client";

import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { HanCountBoard } from "./han-count-board";

export function HanCountTrainingView() {
  const t = useTranslations("hanCountChallenge");
  const { correctCount, totalCount, showFeedback, handleAnswer } =
    useTrainingSession();

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref="/practice/han-count"
      maxWidth="max-w-2xl"
    >
      <HanCountBoard showFeedback={showFeedback} onAnswer={handleAnswer} />
    </TrainingShell>
  );
}
