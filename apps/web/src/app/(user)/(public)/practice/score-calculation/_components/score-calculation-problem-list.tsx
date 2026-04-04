"use client";

import { useTranslations } from "next-intl";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import { formatScoreAnswer } from "../_lib/format-answer";
import { ScoreProblemList } from "../../_components/score-problem-list";

interface ScoreCalculationProblemListProps {
  readonly results: readonly ScoreCalculationQuestionResult[];
}

/**
 * 点数計算ドリルの問題別フィードバック一覧
 * 点数計算問題一覧
 *
 * 各問をアコーディオン形式で表示し、正誤と正解・ユーザー回答の詳細を確認できる。
 */
export function ScoreCalculationProblemList({ results }: ScoreCalculationProblemListProps) {
  const t = useTranslations("scoreCalculationDrill");

  return (
    <ScoreProblemList
      results={results}
      translationNamespace="scoreCalculationDrill"
      renderCorrectAnswer={(answer) => formatScoreAnswer(answer, t)}
      formatAnswer={formatScoreAnswer}
    />
  );
}
