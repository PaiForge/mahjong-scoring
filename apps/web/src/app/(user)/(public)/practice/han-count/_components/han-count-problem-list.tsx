"use client";

import { useTranslations } from "next-intl";
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
  const tResult = useTranslations("hanCountChallenge.result");

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="hanCountChallenge"
      isCorrect={(r) => r.isCorrect}
      renderDetail={(result) => (
        <div className="space-y-1 text-sm">
          <p className="text-surface-500">
            <span className="font-medium">{tResult("correctAnswer")}:</span>{" "}
            {t("hanOption", { count: result.correctHan })}
          </p>
          <p className={result.isCorrect ? "text-green-600" : "text-red-600"}>
            <span className="font-medium">{tResult("yourAnswer")}:</span>{" "}
            {t("hanOption", { count: result.userHan })}
          </p>
        </div>
      )}
    />
  );
}
