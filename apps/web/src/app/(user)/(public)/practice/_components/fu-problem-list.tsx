"use client";

import { useTranslations } from "next-intl";
import { parseHais, parseKazehai, parseTehai } from "@mahjong-scoring/core";
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
 * 保存された結果から出題内容を復元する
 * 出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （符の内訳と回答の比較は文字列に依存しないため表示できる）。
 */
function restoreQuestion(result: FuQuestionResult) {
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
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) => t("fuSuffix", { value: result.correctFu })}
      renderDetail={(result) => {
        const question = restoreQuestion(result);

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
              isCorrect={result.isCorrect}
              correct={t("fuSuffix", { value: result.correctFu })}
              user={t("fuSuffix", { value: result.userFu })}
              difference={{
                correct: result.correctFu,
                user: result.userFu,
                format: (value) => t("fuSuffix", { value }),
              }}
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
