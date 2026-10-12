"use client";

import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";

/**
 * 合計符の出題準備中プレースホルダ
 * 合計符生成中表示
 *
 * URL の出題範囲はクライアントで読むため、盤面はハイドレーション後にしか
 * 描けない。プリレンダー HTML にはこれを出しておく。
 */
export function TotalFuGeneratingPlaceholder() {
  const t = useTranslations("totalFu");
  return (
    <QuestionGeneratingPlaceholder
      label={t("generating")}
      boardHeight="totalFu"
    />
  );
}
