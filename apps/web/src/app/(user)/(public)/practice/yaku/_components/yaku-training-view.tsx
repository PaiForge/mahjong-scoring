"use client";

import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { YakuBoard } from "./yaku-board";

export function YakuTrainingView() {
  const t = useTranslations("yaku");
  const { correctCount, totalCount, showFeedback, handleAnswer } =
    useTrainingSession();

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref="/practice/yaku"
      maxWidth="max-w-2xl"
    >
      <YakuBoard showFeedback={showFeedback} onAnswer={handleAnswer} />
    </TrainingShell>
  );
}
