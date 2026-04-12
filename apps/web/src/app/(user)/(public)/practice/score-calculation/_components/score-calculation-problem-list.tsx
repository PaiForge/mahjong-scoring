"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import { formatScoreAnswer } from "../../_lib/format-score-answer";
import { buildReferenceUrl } from "../../_lib/build-reference-url";
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
  const t = useTranslations("scoreCalculationChallenge");

  return (
    <ScoreProblemList
      results={results}
      translationNamespace="scoreCalculationChallenge"
      renderCorrectAnswer={(answer, result) => (
        <Link
          href={buildReferenceUrl(result)}
          className="text-primary-600 underline hover:text-primary-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          {formatScoreAnswer(answer, t)}
        </Link>
      )}
      formatAnswer={formatScoreAnswer}
    />
  );
}
