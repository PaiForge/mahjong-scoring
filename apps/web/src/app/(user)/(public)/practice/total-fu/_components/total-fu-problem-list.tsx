"use client";

import { useTranslations } from "next-intl";
import { parseHais, parseKazehai, parseTehai } from "@mahjong-scoring/core";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import { TehaiDisplay } from "../../_components/tehai-display";
import type { TotalFuQuestionResult } from "../_lib/types";
import { FuBreakdown } from "./fu-breakdown";

interface TotalFuProblemListProps {
  readonly results: readonly TotalFuQuestionResult[];
}

/**
 * 保存された結果から出題内容を復元する
 * 出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （符の内訳と回答の比較は文字列に依存しないため表示できる）。
 */
function restoreQuestion(result: TotalFuQuestionResult) {
  const tehai = parseTehai(result.tehai);
  const agariHai = parseHais(result.agariHai)[0];
  const bakaze = parseKazehai(result.bakaze);
  const jikaze = parseKazehai(result.jikaze);
  if (!tehai || agariHai === undefined || !bakaze || !jikaze) return undefined;
  return {
    tehai,
    context: { bakaze, jikaze, agariHai, isTsumo: result.isTsumo },
  };
}

/**
 * 合計符練習の問題別フィードバック一覧
 * 合計符問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された手牌・符の内訳・
 * 正解とユーザー回答を確認できる。
 */
export function TotalFuProblemList({ results }: TotalFuProblemListProps) {
  const t = useTranslations("totalFu");

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="totalFu"
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) => t("fuSuffix", { value: result.correctFu })}
      renderDetail={(result) => {
        const question = restoreQuestion(result);

        return (
          <div className="space-y-3">
            {question && (
              <TehaiDisplay
                tehai={question.tehai}
                context={question.context}
                translationNamespace="totalFu"
              />
            )}

            <AnswerComparison
              translationNamespace="totalFu"
              isCorrect={result.isCorrect}
              correct={t("fuSuffix", { value: result.correctFu })}
              user={t("fuSuffix", { value: result.userFu })}
            />

            <FuBreakdown details={result.fuDetails} answer={result.correctFu} />
          </div>
        );
      }}
    />
  );
}
