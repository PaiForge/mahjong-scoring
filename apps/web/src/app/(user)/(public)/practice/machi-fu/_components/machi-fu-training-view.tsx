"use client";

import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { MachiFuBoard } from "./machi-fu-board";

export function MachiFuTrainingView() {
  const t = useTranslations("machiFu");
  const { correctCount, totalCount, showFeedback, handleAnswer } =
    useTrainingSession();

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref="/practice/machi-fu"
    >
      <MachiFuBoard showFeedback={showFeedback} onAnswer={handleAnswer} />
    </TrainingShell>
  );
}
