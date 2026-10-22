import { useTranslations } from "use-intl";
import { buildAnswerComparisonTable } from "@mahjong-scoring/features/practice/answer-comparison-table";

import { DetailTable } from "./detail-table";
import type { AnswerComparisonProps } from "@mahjong-scoring/features/results/answer-comparison-props";

/**
 * 正解とあなたの回答の対比（web の `AnswerComparison`）
 * 答え合わせ
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
