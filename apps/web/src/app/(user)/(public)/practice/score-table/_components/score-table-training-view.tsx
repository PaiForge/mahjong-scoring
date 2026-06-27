"use client";

import { useTranslations } from "next-intl";
import type { ScoreTableGeneratorOptions } from "@mahjong-scoring/core";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { ScoreTableBoard } from "./score-table-board";

interface ScoreTableTrainingViewProps {
  readonly generatorOptions?: ScoreTableGeneratorOptions;
}

export function ScoreTableTrainingView({
  generatorOptions,
}: ScoreTableTrainingViewProps) {
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
        generatorOptions={generatorOptions}
      />
    </TrainingShell>
  );
}
