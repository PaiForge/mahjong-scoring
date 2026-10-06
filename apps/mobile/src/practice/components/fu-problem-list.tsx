import { View } from "react-native";
import { useTranslations } from "use-intl";
import type { FuQuestionResult } from "@mahjong-scoring/features/results/fu-question-result";
import { restoreTehaiQuestion } from "@mahjong-scoring/features/results/parse-question-tiles";

import { TehaiDisplay } from "../../board/tehai-display";
import { TehaiMentsuBreakdown } from "../../board/tehai-mentsu-breakdown";
import { AnswerComparison } from "./answer-comparison";
import { FuBreakdown } from "./fu-breakdown";
import { ProblemListAccordion } from "./problem-list-accordion";

/**
 * 手牌の符を答えた問題の結果一覧（web の `FuProblemList`）
 *
 * 手牌の合計符・面子と雀頭の符・符の昇級試験で共有する。
 */
export function FuProblemList({
  results,
  translationNamespace,
}: {
  readonly results: readonly FuQuestionResult[];
  readonly translationNamespace: string;
}) {
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
          <View style={{ gap: 12 }}>
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
          </View>
        );
      }}
    />
  );
}
