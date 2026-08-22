"use client";

import { useTranslations } from "next-intl";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import type { HanCountQuestionResult } from "../_lib/types";

interface HanCountProblemListProps {
  readonly results: readonly HanCountQuestionResult[];
}

/**
 * 翻数即答練習の問題別フィードバック一覧
 * 翻数問題一覧
 *
 * 各問をアコーディオン形式で表示し、正誤と正解・ユーザー回答の詳細を確認できる。
 */
export function HanCountProblemList({ results }: HanCountProblemListProps) {
  const t = useTranslations("hanCountChallenge");

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="hanCountChallenge"
      isCorrect={(r) => r.isCorrect}
      renderDetail={(result) => (
        <AnswerComparison
          translationNamespace="hanCountChallenge"
          isCorrect={result.isCorrect}
          correct={t("hanOption", { count: result.correctHan })}
          user={t("hanOption", { count: result.userHan })}
        />
      )}
    />
  );
}
