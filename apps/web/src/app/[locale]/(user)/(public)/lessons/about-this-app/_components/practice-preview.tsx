import type { ReactNode } from "react";

import { GuideFigure } from "../../_components/guide-figure";

interface PracticePreviewProps {
  /** 画面の下に添える説明（どの練習の、どんな画面か） */
  readonly caption: ReactNode;
  /** 練習の盤面（遊び方デモ等の実物のコンポーネント） */
  readonly children: ReactNode;
}

/**
 * 練習画面のプレビュー
 *
 * 本文で説明したことを、実際の練習の画面で見せる図。スクリーンショットでは
 * なく実物のコンポーネントを描くため、練習の画面を直せば勝手に追従する。
 *
 * 図の中は `inert` にして押せなくし、読み上げからも外す。盤面の選択肢は
 * 見た目だけで答えを受け付けず、触れても何も起きないため。何の画面かは
 * キャプションが言葉で伝え、練習へのリンクもそこに置く。
 *
 * 枠は練習の説明ページの「問題方式」（`HowToPlaySection`）と同じ — 同じ
 * 盤面を同じ額縁で見せる。
 */
export function PracticePreview({ caption, children }: PracticePreviewProps) {
  return (
    <GuideFigure caption={caption}>
      <div
        inert
        className="rounded-panel border border-panel bg-surface-50 p-4 sm:p-6"
      >
        {children}
      </div>
    </GuideFigure>
  );
}
