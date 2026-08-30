"use client";

import { useTranslations } from "next-intl";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import { TehaiMentsuBreakdown } from "../../_components/tehai-mentsu-breakdown";
import { QuestionDisplay } from "../../score/_components/question-display";
import { restoreScoreQuestion } from "../../_lib/score-question-result";
import { hanCountLabel } from "../_lib/han-options";
import type { HanCountQuestionResult } from "../_lib/types";
import { HanBreakdown } from "./han-breakdown";

interface HanCountProblemListProps {
  readonly results: readonly HanCountQuestionResult[];
}

/**
 * 翻数即答練習の問題別フィードバック一覧
 * 翻数問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された手牌・面子の取り方・
 * 正解とユーザー回答・翻数の内訳を確認できる。翻数だけを突き合わせても
 * 見直しにならない（どの役を数え落としたのかが分からない）ため、出題を
 * そのまま再現したうえで内訳まで並べる。
 */
export function HanCountProblemList({ results }: HanCountProblemListProps) {
  const t = useTranslations("hanCountChallenge");

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="hanCountChallenge"
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) => hanCountLabel(result.correctHan, t)}
      renderDetail={(result) => {
        const question = restoreScoreQuestion(
          result.question,
          result.question?.isTsumo ?? false,
        );

        return (
          <div className="space-y-3">
            {question && (
              <>
                <QuestionDisplay question={question} />
                <TehaiMentsuBreakdown
                  tehai={question.tehai}
                  context={question}
                />
              </>
            )}

            <AnswerComparison
              translationNamespace="hanCountChallenge"
              isCorrect={result.isCorrect}
              correct={hanCountLabel(result.correctHan, t)}
              user={hanCountLabel(result.userHan, t)}
              difference={{
                correct: result.correctHan,
                user: result.userHan,
                format: (value) => t("hanOption", { count: value }),
              }}
            />

            {result.question && (
              <HanBreakdown
                yakuDetails={result.question.yakuDetails}
                correctHan={result.correctHan}
              />
            )}
          </div>
        );
      }}
    />
  );
}
