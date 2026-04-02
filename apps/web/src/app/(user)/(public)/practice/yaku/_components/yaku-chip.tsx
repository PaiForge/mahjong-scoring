"use client";

import { memo, useCallback } from "react";

interface YakuChipProps {
  readonly yakuName: string;
  readonly isSelected: boolean;
  readonly feedbackState: "correct" | "incorrect" | "missed" | undefined;
  readonly disabled: boolean;
  readonly onToggle: (yakuName: string) => void;
}

/**
 * 役選択チップ
 * 役チップ
 */
export const YakuChip = memo(function YakuChip({
  yakuName,
  isSelected,
  feedbackState,
  disabled,
  onToggle,
}: YakuChipProps) {
  const handleClick = useCallback(() => {
    onToggle(yakuName);
  }, [yakuName, onToggle]);

  let chipClasses =
    "inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none";

  if (feedbackState === "correct") {
    chipClasses += " border-green-500 bg-green-50 text-green-700";
  } else if (feedbackState === "incorrect") {
    chipClasses += " border-red-500 bg-red-50 text-red-700";
  } else if (feedbackState === "missed") {
    chipClasses += " border-amber-500 bg-amber-50 text-amber-700";
  } else if (isSelected) {
    chipClasses += " border-primary-500 bg-primary-50 text-primary-700";
  } else {
    chipClasses += " border-surface-200 bg-white text-surface-600 hover:border-primary-300";
  }

  if (disabled && !feedbackState) {
    chipClasses += " opacity-50 pointer-events-none";
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
