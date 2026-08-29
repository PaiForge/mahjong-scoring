import type { ReactNode } from "react";

interface ExampleCardProps {
  readonly children: ReactNode;
  /** 子要素の縦間隔ユーティリティ（既定 space-y-3） */
  readonly spacing?: string;
}

/**
 * 例示カード（白背景・角丸・枠線）
 * 例示カード
 *
 * 教本の章と用語集で頻出する例示ブロックの枠スタイルを一元化する。
 */
export function ExampleCard({
  children,
  spacing = "space-y-3",
}: ExampleCardProps) {
  return (
    <div className={`${spacing} rounded-xl border-3 border-ink bg-white p-5`}>
      {children}
    </div>
  );
}
