"use client";

import { useTranslations } from "next-intl";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import type { YakuHanQuestionResult } from "../_lib/types";
import { isYakuman } from "./yaku-han-answer-form";

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

  const hanLabel = (han: number) =>
    isYakuman(han) ? t("yakuman") : t("hanOption", { count: han });

  // 門前限定役も含め常に付ける（出題時のバッジと表示を揃える）
  const stateLabel = (r: YakuHanQuestionResult) =>
    `（${r.isMenzen ? t("menzen") : t("naki")}）`;

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="yakuHanChallenge"
      isCorrect={(r) => r.isCorrect}
      renderSummary={(r) => `${r.yakuName}${stateLabel(r)}`}
      // 役名と門前 / 鳴きはヘッダーのサマリーが出しているため、
      // 展開後は正解とユーザー回答の対比だけを見せる
      renderDetail={(result) => (
        <AnswerComparison
          translationNamespace="yakuHanChallenge"
          isCorrect={result.isCorrect}
          correct={hanLabel(result.correctHan)}
          user={hanLabel(result.userHan)}
          difference={{
            correct: result.correctHan,
            user: result.userHan,
            format: (value) => t("hanOption", { count: value }),
          }}
        />
      )}
    />
  );
}
