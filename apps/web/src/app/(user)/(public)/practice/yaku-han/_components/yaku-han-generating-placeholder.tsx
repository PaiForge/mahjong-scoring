"use client";

import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";

/**
 * 役翻数の出題準備中プレースホルダ
 * 役翻数生成中表示
 *
 * URL の出題範囲はクライアントで読むため、盤面はハイドレーション後にしか
 * 描けない。プリレンダー HTML にはこれを出しておく。
 */
export function YakuHanGeneratingPlaceholder() {
  const t = useTranslations("yakuHanChallenge");
  return (
    <QuestionGeneratingPlaceholder
      label={t("generating")}
      boardHeight="yakuHan"
    />
  );
}
