"use client";

import { type ReactNode, memo, useCallback } from "react";

interface ChoiceButtonProps {
  /** 選択肢のインデックス（onSelect に渡される識別子） */
  readonly index: number;
  readonly onSelect: (index: number) => void;
  readonly disabled: boolean;
  readonly borderClass: string;
  readonly bgClass: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * メモ化された選択肢ボタン
 * 選択肢ボタン
 *
 * インデックスベースで選択を通知し、インライン arrow function の再生成を防ぐ。
 */
export const ChoiceButton = memo(function ChoiceButton({
  index,
  onSelect,
  disabled,
  borderClass,
  bgClass,
  className = "",
  children,
}: ChoiceButtonProps) {
  const handleClick = useCallback(() => {
    onSelect(index);
  }, [onSelect, index]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`flex items-center justify-center rounded-xl border ${borderClass} ${bgClass} p-4 transition-all ${className}`}
    >
      {children}
    </button>
  );
});
