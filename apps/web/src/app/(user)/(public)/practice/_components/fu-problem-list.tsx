"use client";

import { useTranslations } from "next-intl";
import { restoreTehaiQuestion } from "../_lib/parse-question-tiles";
import { AnswerComparison } from "./answer-comparison";
import { ProblemListAccordion } from "./problem-list-accordion";
import { TehaiDisplay } from "./tehai-display";
import { TehaiMentsuBreakdown } from "./tehai-mentsu-breakdown";
import { FuBreakdown } from "./fu-breakdown";
import type { FuQuestionResult } from "../_lib/fu-question-result";

interface FuProblemListProps {
  readonly results: readonly FuQuestionResult[];
  /** 練習の翻訳名前空間（例: "totalFu"） */
  readonly translationNamespace: string;
}

/**
 * 手牌の合計符を答える出題の問題別フィードバック一覧
 * 合計符問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された手牌・符の内訳・
 * 正解とユーザー回答を確認できる。合計符を答える練習と昇級試験で共有する。
 */
export function FuProblemList({
  results,
  translationNamespace,
}: FuProblemListProps) {
  const t = useTranslations(translationNamespace);

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace={translationNamespace}
      outcome={(r) => r.outcome}
      renderSummary={(result) => t("fuSuffix", { value: result.correctFu })}
      renderDetail={(result) => {
        const question = restoreTehaiQuestion(result);
        const { userFu } = result;

        return (
          <div className="space-y-3">
            {question && (
              <>
                <TehaiDisplay
                  tehai={question.tehai}
                  context={question.context}
                />
                <TehaiMentsuBreakdown
                  tehai={question.tehai}
                  context={question.context}
                />
              </>
            )}

            <AnswerComparison
              translationNamespace={translationNamespace}
              outcome={result.outcome}
              correct={t("fuSuffix", { value: result.correctFu })}
              user={
                userFu === undefined
                  ? undefined
                  : t("fuSuffix", { value: userFu })
              }
              difference={
                userFu === undefined
                  ? undefined
                  : {
                      correct: result.correctFu,
                      user: userFu,
                      format: (value) => t("fuSuffix", { value }),
                    }
              }
            />

            <FuBreakdown
              details={result.fuDetails}
              answer={result.correctFu}
              translationNamespace={translationNamespace}
            />
          </div>
        );
      }}
    />
  );
}
