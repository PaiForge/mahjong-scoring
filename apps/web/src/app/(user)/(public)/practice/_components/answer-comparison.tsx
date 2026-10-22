"use client";

import { useTranslations } from "next-intl";
import { buildAnswerComparisonTable } from "@mahjong-scoring/features/practice/answer-comparison-table";
import { DetailTable } from "./detail-table";
import type { AnswerComparisonProps } from "@mahjong-scoring/features/results/answer-comparison-props";

/**
 * 「正解 / あなたの回答」の対比表示
 * 回答対比
 *
 * 各練習の問題別フィードバック（{@link ProblemListAccordion} の renderDetail）で
 * 共通に使う体裁。何を正解として見せるかは練習ごとに違うので、値の組み立ては
 * 呼び出し側に任せ、ここは並べ方と正誤の色分けだけを持つ。
 *
 * 表そのものは {@link DetailTable} に委ねる。同じ詳細の中に並ぶ符・翻の内訳と
 * 同じ形（名前と値の表）にして、詳細の中で見た目を割らない。
 *
 * 数値で答える練習は `difference` を渡して「過不足」の行で締める。内訳の
 * 合計行と同じ位置に同じ体裁の行が来るので、2つの表の丈が揃うだけでなく、
 * 「何翻ずれていたのか」がその場で読める。役の選択のように差が数値に
 * ならない練習は渡さない（過不足はチップの色が示している）。雀頭符・待ち符の
 * ように符が数段階しかない練習も渡さない（正解と回答の符が並んだ時点で差は
 * 読み取れており、行を足しても情報が増えない）。
 */
export function AnswerComparison({
  translationNamespace,
  correct,
  user,
  outcome,
  difference,
  showTitle = true,
}: AnswerComparisonProps) {
  const tResult = useTranslations(`${translationNamespace}.result`);
  const tCommon = useTranslations("common");
  return (
    <DetailTable
      {...buildAnswerComparisonTable({
        tResult,
        tCommon,
        correct,
        user,
        outcome,
        difference,
        showTitle,
      })}
    />
  );
}
