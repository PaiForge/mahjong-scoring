"use client";

import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { MentsuFuBoard } from "./mentsu-fu-board";

export function MentsuFuTrainingView() {
  const t = useTranslations("mentsuFu");
  const { correctCount, totalCount, showFeedback, handleAnswer } =
    useTrainingSession();

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref="/practice/mentsu-fu"
    >
      <MentsuFuBoard showFeedback={showFeedback} onAnswer={handleAnswer} />
    </TrainingShell>
  );
}
