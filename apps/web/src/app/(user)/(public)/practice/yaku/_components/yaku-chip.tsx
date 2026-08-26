"use client";

import { memo, useCallback } from "react";

interface YakuChipProps {
  readonly yakuName: string;
  readonly isSelected: boolean;
  readonly feedbackState: "correct" | "incorrect" | "missed" | undefined;
  readonly disabled: boolean;
  /**
   * 静的なプレビュー用（押せないが、未選択の見た目のまま）
   *
   * `disabled` の減光はカウントダウン中など「今は押せない」ことを伝えるための
   * もので、出題例のプレビューでは無効に見えてしまうため切り離す。
   */
  readonly presentational?: boolean;
  readonly onToggle: (yakuName: string) => void;
}

/**
 * 役選択チップ
 * 役チップ
 */
export const YakuChip = memo(function YakuChipComponent({
  yakuName,
  isSelected,
  feedbackState,
  disabled,
  presentational = false,
  onToggle,
}: YakuChipProps) {
  const handleClick = useCallback(() => {
    onToggle(yakuName);
  }, [yakuName, onToggle]);

  let chipClasses =
    "inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none";

  if (feedbackState === "correct") {
    chipClasses += " border-primary-500 bg-primary-50 text-primary-700";
  } else if (feedbackState === "incorrect") {
    chipClasses +=
      " border-destructive bg-destructive-subtle text-destructive-strong";
  } else if (feedbackState === "missed") {
    chipClasses += " border-warning bg-warning-subtle text-warning-strong";
  } else if (isSelected) {
    chipClasses += " border-primary-500 bg-primary-50 text-primary-700";
  } else {
    chipClasses +=
      " border-surface-200 bg-white text-surface-600 hover:border-primary-300";
  }

  if (disabled && !feedbackState) {
    chipClasses += presentational
      ? " pointer-events-none"
      : " opacity-50 pointer-events-none";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled && !feedbackState}
      className={chipClasses}
    >
      {yakuName}
    </button>
  );
});

/**
 * 各役のフィードバック状態を計算する
 * フィードバック状態計算
 */
export function getChipFeedbackState(
  yakuName: string,
  selectedYaku: ReadonlySet<string>,
  correctYakuNames: readonly string[],
): "correct" | "incorrect" | "missed" | undefined {
  const isSelected = selectedYaku.has(yakuName);
  const isCorrect = correctYakuNames.includes(yakuName);

  if (isSelected && isCorrect) return "correct";
  if (isSelected && !isCorrect) return "incorrect";
  if (!isSelected && isCorrect) return "missed";
  return undefined;
}
