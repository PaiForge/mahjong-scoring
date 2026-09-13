"use client";

import {
  parseMarkers,
  parseQuestionTiles,
} from "../../_lib/parse-question-tiles";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import { TehaiDisplay } from "../../_components/tehai-display";
import { TehaiMentsuBreakdown } from "../../_components/tehai-mentsu-breakdown";
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
  const tiles = parseQuestionTiles(result);
  if (!tiles) return undefined;
  const { tehai, ...context } = tiles;
  return {
    tehai,
    context: {
      ...context,
      isTsumo: result.isTsumo,
      isRiichi: result.isRiichi,
      doraMarkers: parseMarkers(result.doraMarkers) ?? [],
      uraDoraMarkers: parseMarkers(result.uraDoraMarkers),
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
 *
 * 並び順は点数系・翻数系の問題別一覧と同じ「手牌 → 面子の内訳 → 答え合わせ」。
 * 面子分解（{@link TehaiMentsuBreakdown}）を挟むのは、見落とした役の多くが
 * 手牌の分け方から読むものだから — 一盃口も三色も対々和も、どの牌がどの面子に
 * なっていたかが見えて初めて「なぜ成立していたのか」が分かる。七対子・国士の
 * ように分解を持たない手では導線ごと出ない（分解側が何も描かない）。
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
