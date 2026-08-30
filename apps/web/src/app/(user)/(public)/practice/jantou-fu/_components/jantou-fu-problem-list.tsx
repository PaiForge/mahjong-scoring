"use client";

import { useTranslations } from "next-intl";
import { getKazeName, parseHais, parseKazehai } from "@mahjong-scoring/core";
import type { HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import type { JantouFuQuestionResult } from "../_lib/types";

interface JantouFuProblemListProps {
  readonly results: readonly JantouFuQuestionResult[];
}

/**
 * 雀頭符練習の問題別フィードバック一覧
 * 雀頭符問題一覧
 *
 * 同じ牌でも場風・自風しだいで符が変わるため、出題時の風をアコーディオンの
 * 見出しに出す（展開しても見出しは残るので、牌と符を風と突き合わせて読める）。
 * 展開後は正解の雀頭と自分が選んだ雀頭を、それぞれの符とともに並べる。
 */
export function JantouFuProblemList({ results }: JantouFuProblemListProps) {
  const t = useTranslations("jantouFu");
  const tCommon = useTranslations("common");

  /** 牌とその符を横に並べる（正解・回答の両方で同じ体裁にする） */
  const haiWithFu = (hai: HaiKindId | undefined, fu: number) => (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {hai !== undefined && <Hai hai={hai} size="sm" />}
      {t("fu", { value: fu })}
    </span>
  );

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="jantouFu"
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) => {
        const bakaze = parseKazehai(result.bakaze);
        const jikaze = parseKazehai(result.jikaze);
        if (!bakaze || !jikaze) return undefined;
        return `${getKazeName(bakaze)}${tCommon("round")} ${getKazeName(jikaze)}${tCommon("wind")}`;
      }}
      renderDetail={(result) => (
        <AnswerComparison
          translationNamespace="jantouFu"
          isCorrect={result.isCorrect}
          correct={haiWithFu(parseHais(result.correctHai)[0], result.correctFu)}
          user={haiWithFu(parseHais(result.selectedHai)[0], result.selectedFu)}
          difference={{
            correct: result.correctFu,
            user: result.selectedFu,
            format: (value) => t("fu", { value }),
          }}
        />
      )}
    />
  );
}
