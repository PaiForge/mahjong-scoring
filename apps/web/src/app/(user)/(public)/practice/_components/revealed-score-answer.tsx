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
 * 「わからない」で開示した正解の点数
 * 正解開示表示
 *
 * 点数を答える練習（点数表早引き・点数計算）の回答フィードバックは枠の色分け
 * だけで正解値を出さないため、開示中はこれを問題カード内に置いて正解を示す。
 * ロンの点数には単位が無いため「点」を付ける。
 */
export function RevealedScoreAnswer({
  answer,
  translationNamespace,
}: RevealedScoreAnswerProps) {
  const t = useTranslations(translationNamespace);

  return (
    <p className="text-center text-lg font-bold text-surface-800">
      {t("revealedAnswer", {
        answer: formatScoreAnswer(answer, (key) => t(key), {
          ronSuffix: t("pointSuffix"),
        }),
      })}
    </p>
  );
}
