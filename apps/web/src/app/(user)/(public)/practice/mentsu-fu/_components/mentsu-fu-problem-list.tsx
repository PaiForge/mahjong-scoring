"use client";

import { useTranslations } from "next-intl";
import { Furo } from "@pai-forge/mahjong-react-ui";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import { restoreMentsu } from "../../_lib/mentsu-serialization";
import type { MentsuFuQuestionResult } from "../_lib/types";

interface MentsuFuProblemListProps {
  readonly results: readonly MentsuFuQuestionResult[];
}

/**
 * 面子符練習の問題別フィードバック一覧
 * 面子符問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された面子と、正解・自分の
 * 回答を確認できる。符は明暗（鳴いているか）と牌の種類で決まるため、面子を
 * 出さずに符だけ並べても何を間違えたのかが読めない。
 */
export function MentsuFuProblemList({ results }: MentsuFuProblemListProps) {
  const t = useTranslations("mentsuFu");
  const fuLabel = (fu: number) => t("fuOption", { value: fu });

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="mentsuFu"
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) => fuLabel(result.correctFu)}
      renderDetail={(result) => {
        const mentsu = restoreMentsu(result.mentsu);

        return (
          <div className="space-y-3">
            {mentsu && (
              <div className="flex justify-center py-1">
                <Furo mentsu={mentsu} furo={mentsu.furo} size="sm" />
              </div>
            )}

            <AnswerComparison
              translationNamespace="mentsuFu"
              isCorrect={result.isCorrect}
              correct={fuLabel(result.correctFu)}
              user={fuLabel(result.userFu)}
              difference={{
                correct: result.correctFu,
                user: result.userFu,
                format: fuLabel,
              }}
            />
          </div>
        );
      }}
    />
  );
}
