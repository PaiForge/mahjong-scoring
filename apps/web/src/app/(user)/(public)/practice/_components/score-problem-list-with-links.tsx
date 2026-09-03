"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { isFu } from "@mahjong-scoring/core";
import type { ScoreQuestionResult } from "../_lib/score-question-result";
import { formatScoreAnswer } from "../_lib/format-score-answer";
import { ScoreTableModal } from "../score/_components/score-table-modal";
import { ScoreProblemList } from "./score-problem-list";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { ScoreTableFocus } from "@/app/(user)/(public)/reference/score-table/_lib/score-table-utils";

interface ScoreProblemListWithLinksProps {
  readonly results: readonly ScoreQuestionResult[];
  /**
   * i18n の翻訳ネームスペース（例: "scoreTableChallenge"）
   * 翻訳ネームスペース
   */
  readonly translationNamespace: string;
}

/**
 * 点数系練習共通の問題別フィードバック一覧（点数表モーダル付き）
 * 点数問題一覧（点数表付き）
 *
 * ScoreProblemList をラップし、正解値を押すとその条件をハイライトした点数表を
 * モーダルで表示する。点数表練習・点数計算練習で共通して使用される。
 */
export function ScoreProblemListWithLinks({
  results,
  translationNamespace,
}: ScoreProblemListWithLinksProps) {
  const t = useTranslations(translationNamespace);
  const [scoreTableFocus, setScoreTableFocus] =
    useState<ScoreTableFocus | null>(null);

  return (
    <>
      <ScoreProblemList
        results={results}
        translationNamespace={translationNamespace}
        renderCorrectAnswer={(answer, result) => (
          <button
            type="button"
            className={TEXT_LINK_CLASSES}
            onClick={() =>
              setScoreTableFocus({
                role: result.isOya ? "oya" : "ko",
                winType: result.isTsumo ? "tsumo" : "ron",
                han: result.han,
                fu:
                  result.fu !== undefined && isFu(result.fu)
                    ? result.fu
                    : undefined,
              })
            }
          >
            {formatScoreAnswer(answer, t)}
          </button>
        )}
        formatAnswer={formatScoreAnswer}
      />
      {scoreTableFocus !== null && (
        <ScoreTableModal
          isOpen
          onClose={() => setScoreTableFocus(null)}
          focus={scoreTableFocus}
          highlighted
        />
      )}
    </>
  );
}
