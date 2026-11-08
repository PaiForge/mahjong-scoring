import type { ReactNode } from "react";

interface PromptLabelProps {
  readonly children: ReactNode;
}

/**
 * 出題盤面の見出しラベル（「待ち」「和了牌」「面子」など）
 * 出題ラベル
 *
 * 盤面と遊び方デモの双方から使い、ラベルの体裁を 1 箇所で持つ。
 */
export function PromptLabel({ children }: PromptLabelProps) {
  return (
    <span className="text-sm font-bold uppercase tracking-widest text-surface-400">
      {children}
    </span>
  );
}
