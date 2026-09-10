"use client";

import { useTranslations } from "next-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";

import { QuestionPrompt } from "../../_components/question-prompt";
import { RevealedScoreAnswer } from "../../_components/revealed-score-answer";
import { scoreTableFocusOf } from "../../_lib/score-table-focus";

interface ScoreTablePromptProps {
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  /** 符。満貫以上は点数が符に依存しないため省く */
  readonly fu?: number;
  /**
   * 開示する正解。指定時は出題文の行をこれに差し替える
   * （トレーニングの「わからない」と不正解のあと）。正解の点数は押すと
   * この条件のセルをハイライトした点数早見表が開く
   */
  readonly revealedAnswer?: ScoreTableAnswer;
}

/**
 * 点数表早引きの出題提示（親子・ツモロン・翻・符）
 * 点数表出題提示
 *
 * 出題盤面（ScoreTableBoard）と遊び方デモ（ScoreTableHowToPlay）で共有する、
 * 出題条件の「見せ方」の単一実装。盤面を変えるとデモも追従する
 * （machi-fu / yaku-han の *-prompt.tsx と同じ位置づけ）。
 */
export function ScoreTablePrompt({
  isOya,
  isTsumo,
  han,
  fu,
  revealedAnswer,
}: ScoreTablePromptProps) {
  const t = useTranslations("scoreTableChallenge");

  return (
    <>
      <div className="flex justify-center gap-6">
        <span className="text-2xl font-bold text-surface-900">
          {isOya ? t("oya") : t("ko")}
        </span>
        <span className="text-2xl font-bold text-surface-900">
          {isTsumo ? t("tsumo") : t("ron")}
        </span>
      </div>

      <div className="flex justify-center gap-6">
        <span className="text-2xl font-bold text-primary-600">
          {t("han", { count: han })}
        </span>
        {fu !== undefined && (
          <span className="text-2xl font-bold text-primary-600">
            {t("fu", { count: fu })}
          </span>
        )}
      </div>

      <QuestionPrompt
        replacement={
          revealedAnswer === undefined ? undefined : (
            <RevealedScoreAnswer
              answer={revealedAnswer}
              translationNamespace="scoreTableChallenge"
              scoreTableFocus={scoreTableFocusOf({ isOya, isTsumo, han, fu })}
            />
          )
        }
      >
        {t("questionLabel")}
      </QuestionPrompt>
    </>
  );
}
