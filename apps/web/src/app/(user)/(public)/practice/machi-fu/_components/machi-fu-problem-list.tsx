"use client";

import { useTranslations } from "next-intl";
import { parseHais } from "@mahjong-scoring/core";
import { AnswerComparison } from "../../_components/answer-comparison";
import { ProblemListAccordion } from "../../_components/problem-list-accordion";
import type { MachiFuQuestionResult } from "../_lib/types";
import { MachiFuPrompt } from "./machi-fu-prompt";

interface MachiFuProblemListProps {
  readonly results: readonly MachiFuQuestionResult[];
}

/**
 * 待ち符練習の問題別フィードバック一覧
 * 待ち符問題一覧
 *
 * 各問をアコーディオン形式で表示し、展開すると出題された待ち形と、正解・自分の
 * 回答を確認できる。符は待ちの形で決まるため、形を出さずに符だけ並べても何を
 * 間違えたのかが読めない。待ち形の見せ方は出題盤面と同じ `MachiFuPrompt`。
 */
export function MachiFuProblemList({ results }: MachiFuProblemListProps) {
  const t = useTranslations("machiFu");
  const fuLabel = (fu: number) => t("fuOption", { value: fu });

  return (
    <ProblemListAccordion
      results={results}
      translationNamespace="machiFu"
      isCorrect={(r) => r.isCorrect}
      renderSummary={(result) => fuLabel(result.correctFu)}
      renderDetail={(result) => {
        const tiles = parseHais(result.tiles);
        const agariHai = parseHais(result.agariHai)[0];

        return (
          <div className="space-y-3">
            {agariHai !== undefined && tiles.length > 0 && (
              <MachiFuPrompt tiles={tiles} agariHai={agariHai} />
            )}

            <AnswerComparison
              translationNamespace="machiFu"
              isCorrect={result.isCorrect}
              correct={fuLabel(result.correctFu)}
              user={fuLabel(result.userFu)}
              difference={{
                correct: result.correctFu,
                user: result.userFu,
                format: fuLabel,
              }}
            />
          </div>
        );
      }}
    />
  );
}
