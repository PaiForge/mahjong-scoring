"use client";

import { useTranslations } from "next-intl";
import type { ScoreTableGeneratorOptions } from "@mahjong-scoring/core";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingShell } from "../../_components/training-shell";
import { ScoreTableBoard } from "./score-table-board";
import { useScoreTableQuestion } from "../_hooks/use-score-table-question";

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
  const { question, advance } = useScoreTableQuestion(generatorOptions);

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref="/practice/score-table"
      onSkip={advance}
      skipDisabled={showFeedback}
    >
      <ScoreTableBoard
        question={question}
        onAdvance={advance}
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        onAnswer={handleAnswer}
      />
    </TrainingShell>
  );
}
