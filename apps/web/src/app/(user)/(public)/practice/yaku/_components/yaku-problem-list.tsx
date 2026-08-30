"use client";

import { parseHais, parseKazehai, parseTehai } from "@mahjong-scoring/core";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import { TehaiDisplay } from "../../_components/tehai-display";
import type { YakuQuestionResult } from "../_lib/types";
import { YakuAnswerComparison } from "./yaku-answer-comparison";

interface YakuProblemListProps {
  readonly results: readonly YakuQuestionResult[];
}

/**
 * 保存された結果から出題内容を復元する
 * 出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （役の対比は文字列に依存しないため表示できる）。
 */
function restoreQuestion(result: YakuQuestionResult) {
  const tehai = parseTehai(result.tehai);
  const agariHai = parseHais(result.agariHai)[0];
  const bakaze = parseKazehai(result.bakaze);
  const jikaze = parseKazehai(result.jikaze);
  if (!tehai || agariHai === undefined || !bakaze || !jikaze) return undefined;
  return {
    tehai,
    context: {
      bakaze,
      jikaze,
      agariHai,
      isTsumo: result.isTsumo,
      isRiichi: result.isRiichi,
      doraMarkers: result.doraMarkers.flatMap((marker) => parseHais(marker)),
    },
  };
}

/**
 * 役選択練習の問題別フィードバック一覧
 * 役選択問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された手牌と、成立していた
 * 役・自分が選んだ役を確認できる。答え合わせの体裁はトレーニングの停止中と
 * 共通（{@link YakuAnswerComparison}）。
 */
export function YakuProblemList({ results }: YakuProblemListProps) {
  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="yaku"
      isCorrect={(r) => r.isCorrect}
      renderDetail={(result) => {
        const question = restoreQuestion(result);

        return (
          <div className="space-y-3">
            {question && (
              <TehaiDisplay tehai={question.tehai} context={question.context} />
            )}

            <YakuAnswerComparison
              correctYakuNames={result.correctYakuNames}
              selectedYakuNames={result.selectedYakuNames}
              isCorrect={result.isCorrect}
            />
          </div>
        );
      }}
    />
  );
}
