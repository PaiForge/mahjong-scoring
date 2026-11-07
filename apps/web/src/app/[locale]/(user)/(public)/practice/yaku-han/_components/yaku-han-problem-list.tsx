"use client";

import { useTranslations } from "next-intl";
import { numericAnswerComparison } from "@mahjong-scoring/features/practice/answer-difference";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import type { YakuHanQuestionResult } from "@mahjong-scoring/features/practice/yaku-han/types";
import { yakuHanStateLabel } from "@mahjong-scoring/features/practice/yaku-han/han-options";
import { hanOptionLabel } from "@mahjong-scoring/features/practice/han-option-label";
import { useYakuHanYakuLabel } from "../_hooks/use-yaku-han-yaku-label";

interface YakuHanProblemListProps {
  readonly results: readonly YakuHanQuestionResult[];
}

/**
 * 役翻数練習の問題別フィードバック一覧
 * 役翻数問題一覧
 *
 * 各問をアコーディオン形式で表示し、正誤と正解・ユーザー回答の詳細を確認できる。
 */
export function YakuHanProblemList({ results }: YakuHanProblemListProps) {
  const t = useTranslations("yakuHanChallenge");
  const tPractice = useTranslations("practice");
  const labelOf = useYakuHanYakuLabel();

  const hanLabel = (han: number) => hanOptionLabel(han, t);

  // 門前 / 鳴きは門前限定役も含め常に添える（出題時のバッジと表示を揃える）。
  // 「役名（門前）」の括弧は言語で形が違う（日本語は全角で前に空白なし、英語は
  // 半角で前に空白）ので辞書の文型で組む。いまは同じ形の
  // `practice.titleWithVariant`（`{title}（{variant}）` / `{title} ({variant})`）を借りている
  const summaryLabel = (r: YakuHanQuestionResult) =>
    tPractice("titleWithVariant", {
      title: labelOf(r.yakuName),
      variant: yakuHanStateLabel(r.isMenzen, t),
    });

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="yakuHanChallenge"
      outcome={(r) => r.outcome}
      renderSummary={summaryLabel}
      // 役名と門前 / 鳴きはヘッダーのサマリーが出しているため、
      // 展開後は正解とユーザー回答の対比だけを見せる
      renderDetail={({ correctHan, userHan, outcome }) => (
        <AnswerComparison
          translationNamespace="yakuHanChallenge"
          outcome={outcome}
          {...numericAnswerComparison(correctHan, userHan, hanLabel, (value) =>
            t("hanOption", { count: value }),
          )}
        />
      )}
    />
  );
}
