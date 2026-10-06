import type { ReactNode } from "react";
import { useTranslations } from "use-intl";
import {
  formatDifference,
  type AnswerDifference,
} from "@mahjong-scoring/features/practice/answer-difference";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

import { DetailTable } from "./detail-table";

interface AnswerComparisonProps {
  /** `<namespace>.result.correctAnswer` / `yourAnswer` を引く辞書の名前空間 */
  readonly translationNamespace: string;
  readonly correct: ReactNode;
  readonly user: ReactNode;
  readonly outcome: AnswerOutcome | undefined;
  /** 数で答える練習の過不足 */
  readonly difference?: AnswerDifference;
  readonly showTitle?: boolean;
}

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
  const isTimeUp = outcome === AnswerOutcome.TimeUp;
  return (
    <DetailTable
      title={showTitle ? tCommon("answerCheck") : undefined}
      total={
        difference === undefined || isTimeUp
          ? undefined
          : {
              label: tCommon("difference"),
              value: formatDifference(difference, tCommon("noDifference")),
            }
      }
      rows={[
        { label: tResult("correctAnswer"), value: correct },
        {
          label: tResult("yourAnswer"),
          value: isTimeUp ? tCommon("timeUpAnswer") : user,
          tone:
            outcome === AnswerOutcome.Correct
              ? "correct"
              : outcome === AnswerOutcome.Incorrect
                ? "incorrect"
                : undefined,
        },
      ]}
    />
  );
}
