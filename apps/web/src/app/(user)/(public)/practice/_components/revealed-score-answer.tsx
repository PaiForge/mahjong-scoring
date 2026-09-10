"use client";

import { useTranslations } from "next-intl";
import type { ScoreTableAnswer } from "@mahjong-scoring/core";

import { formatScoreAnswer } from "../_lib/format-score-answer";

interface RevealedScoreAnswerProps {
  /** 開示する正解の点数 */
  readonly answer: ScoreTableAnswer;
  /** `revealedAnswer` / `pointSuffix` / `all` キーを持つ翻訳名前空間 */
  readonly translationNamespace: string;
}

/**
 * トレーニングで開示する正解の点数
 * 正解開示表示
 *
 * 点数を答える練習（点数表早引き・点数計算）は選択肢を持たないため、回答の
 * フィードバックだけでは正解値が分からない。「わからない」と不正解のあとに
 * 出題文の行と差し替えて出す（{@link import("./question-prompt").QuestionPrompt}
 * の `replacement`）。正解のときは出さない — 選んだ値がそのまま正解で、
 * 枠の色が正誤を示している。
 *
 * 出題文と同じ 1 行（20px）に収めるため行間を `leading-5` に詰める。行を
 * 高くすると差し替えた瞬間に回答欄が動く。ロンの点数には単位が無いため
 * 「点」を付ける。
 */
export function RevealedScoreAnswer({
  answer,
  translationNamespace,
}: RevealedScoreAnswerProps) {
  const t = useTranslations(translationNamespace);

  return (
    <p className="text-center text-base leading-5 font-bold text-surface-800">
      {t("revealedAnswer", {
        answer: formatScoreAnswer(answer, (key) => t(key), {
          ronSuffix: t("pointSuffix"),
        }),
      })}
    </p>
  );
}
