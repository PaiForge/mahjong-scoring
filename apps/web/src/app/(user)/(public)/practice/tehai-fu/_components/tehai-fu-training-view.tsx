"use client";

import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { TehaiFuBoard } from "./tehai-fu-board";

export function TehaiFuTrainingView() {
  const t = useTranslations("tehaiFu");
  const { correctCount, totalCount, showFeedback, handleAnswer } =
    useTrainingSession();

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref="/practice/tehai-fu"
      maxWidth="max-w-lg"
    >
      <TehaiFuBoard showFeedback={showFeedback} onAnswer={handleAnswer} />
    </TrainingShell>
  );
}
