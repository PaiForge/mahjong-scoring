import type { ReactNode } from "react";

interface OutlineIconProps {
  readonly className: string;
  /** アイコンの図形（`<path>` など） */
  readonly children: ReactNode;
}

/**
 * 線画アイコンの外殻
 * 線画アイコン
 *
 * 24x24 のビューボックス・線幅・線端の丸めといった線画アイコン共通の体裁を
 * 1 箇所に集約する。各アイコンは図形（`d`）と既定サイズだけを持つ。
 *
 * `stroke-linecap` / `stroke-linejoin` は継承されるプレゼンテーション属性の
 * ため `<svg>` 側に置く。各 `<path>` に書いたときと描画は変わらない。
 */
export function OutlineIcon({ className, children }: OutlineIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
