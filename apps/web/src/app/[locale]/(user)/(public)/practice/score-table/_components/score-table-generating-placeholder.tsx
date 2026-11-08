"use client";

import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";

/**
 * 点数表早引きの出題準備中プレースホルダ
 * 点数表生成中表示
 *
 * URL の出題条件はクライアントで読むため、盤面はハイドレーション後にしか
 * 描けない。プリレンダー HTML にはこれを出しておく。
 */
export function ScoreTableGeneratingPlaceholder() {
  const t = useTranslations("scoreTableChallenge");
  return (
    <QuestionGeneratingPlaceholder
      label={t("generating")}
      boardHeight="scoreTable"
    />
  );
}
