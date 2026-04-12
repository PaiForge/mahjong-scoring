"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";
import type { ScoreQuestionResult } from "../_lib/score-question-result";
import { ProblemListAccordion } from "./problem-list-accordion";

interface ScoreProblemListProps {
  readonly results: readonly ScoreQuestionResult[];
  /** i18n の翻訳ネームスペース（例: "scoreTableChallenge"） */
  readonly translationNamespace: string;
  /** 正解を表示する際のレンダリング関数。リンク付き表示などをカスタマイズできる */
  readonly renderCorrectAnswer: (answer: ScoreTableAnswer, result: ScoreQuestionResult) => ReactNode;
  /** ユーザー回答を表示する際のフォーマット関数 */
  readonly formatAnswer: (answer: ScoreTableAnswer, t: (key: string) => string) => string;
}

/**
 * 点数系ドリル共通の問題別フィードバック一覧
 * 点数問題一覧
 *
 * 各問をアコーディオン形式で表示し、正誤と正解・ユーザー回答の詳細を確認できる。
 */
export function ScoreProblemList({
  results,
  translationNamespace,
  renderCorrectAnswer,
  formatAnswer,
}: ScoreProblemListProps) {
  const t = useTranslations(translationNamespace);
  const tResult = useTranslations(`${translationNamespace}.result`);

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace={translationNamespace}
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) => {
        const summary = [
          result.isOya ? t("oya") : t("ko"),
          result.isTsumo ? t("tsumo") : t("ron"),
          t("han", { count: result.han }),
          t("fu", { count: result.fu }),
        ].join("\u30FB");
        return summary;
      }}
      renderDetail={(result) => (
        <div className="space-y-1 text-sm">
          <p className="text-surface-500">
            <span className="font-medium">{tResult("correctAnswer")}:</span>{" "}
            {renderCorrectAnswer(result.correctAnswer, result)}
          </p>
          <p className={result.isCorrect ? "text-green-600" : "text-red-600"}>
            <span className="font-medium">{tResult("yourAnswer")}:</span>{" "}
            {formatAnswer(result.userAnswer, t)}
          </p>
        </div>
      )}
    />
  );
}
