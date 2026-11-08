"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SCORE_TABLE_LINK_CLASSES } from "../_lib/score-table-link-classes";

interface ScoreTableValueButtonProps {
  /** 押せるようにする値（「3翻」「50符」） */
  readonly children: ReactNode;
  readonly onClick: () => void;
}

/**
 * 内訳の値から点数表を開くボタン
 * 内訳の点数表リンク
 *
 * 翻数・符の内訳の答えの値（翻数の合計・切り上げ後の符）を押せるようにする。
 * 内訳で数え直した人が、その翻・符の組が点数表のどこにあるかを続けて
 * 確かめられる。見た目は答え合わせの正解の点数と同じ点線の下線
 * （{@link SCORE_TABLE_LINK_CLASSES}）で、文字の大きさ・太さは表のまま。
 */
export function ScoreTableValueButton({
  children,
  onClick,
}: ScoreTableValueButtonProps) {
  const t = useTranslations("challenge");

  return (
    <button
      type="button"
      onClick={onClick}
      title={t("openInScoreTable")}
      className={SCORE_TABLE_LINK_CLASSES}
    >
      {children}
    </button>
  );
}
