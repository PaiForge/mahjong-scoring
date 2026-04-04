"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ScoreTableQuestionResult } from "../_lib/types";
import { buildReferenceUrl } from "../_lib/build-reference-url";
import { formatAnswer } from "../_lib/format-answer";
import { ScoreProblemList } from "../../_components/score-problem-list";

interface ScoreTableProblemListProps {
  readonly results: readonly ScoreTableQuestionResult[];
}

/**
 * 点数表ドリルの問題別フィードバック一覧
 * 点数表問題一覧
 *
 * 各問をアコーディオン形式で表示し、正誤と正解・ユーザー回答の詳細を確認できる。
 */
export function ScoreTableProblemList({ results }: ScoreTableProblemListProps) {
  const t = useTranslations("scoreTableDrill");

  return (
    <ScoreProblemList
      results={results}
      translationNamespace="scoreTableDrill"
      renderCorrectAnswer={(answer, result) => (
        <Link
          href={buildReferenceUrl(result)}
          className="text-primary-600 underline hover:text-primary-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          {formatAnswer(answer, t)}
        </Link>
      )}
      formatAnswer={formatAnswer}
    />
  );
}
