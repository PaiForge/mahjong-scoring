"use client";

import { useTranslations } from "next-intl";
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
  const tResult = useTranslations("yakuHanChallenge.result");

  const hanLabel = (han: number) =>
    isYakuman(han) ? t("yakuman") : t("hanOption", { count: han });

  // 門前限定役は状態ラベルを出さない（出題時と表示を揃える）
  const stateLabel = (r: YakuHanQuestionResult) =>
    r.canNaki ? `（${r.isMenzen ? t("menzen") : t("naki")}）` : "";

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="yakuHanChallenge"
      isCorrect={(r) => r.isCorrect}
      renderSummary={(r) => `${r.yakuName}${stateLabel(r)}`}
      renderDetail={(result) => (
        <div className="space-y-1 text-sm">
          <p className="text-surface-700">
            <span className="font-medium">{result.yakuName}</span>{" "}
            {result.canNaki && (
              <span className="text-surface-500">
                （{result.isMenzen ? t("menzen") : t("naki")}）
              </span>
            )}
          </p>
          <p className="text-surface-500">
            <span className="font-medium">{tResult("correctAnswer")}:</span>{" "}
            {hanLabel(result.correctHan)}
          </p>
          <p className={result.isCorrect ? "text-green-600" : "text-red-600"}>
            <span className="font-medium">{tResult("yourAnswer")}:</span>{" "}
            {hanLabel(result.userHan)}
          </p>
        </div>
      )}
    />
  );
}
