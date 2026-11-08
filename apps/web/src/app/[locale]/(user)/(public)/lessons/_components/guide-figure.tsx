import type { ReactNode } from "react";

interface GuideFigureProps {
  /** 図の下に添える説明・注記（「※」のような行頭記号は文言側が持つ） */
  readonly caption: ReactNode;
  /** 図の本体（練習の画面のプレビュー・表など） */
  readonly children: ReactNode;
}

/**
 * 教本の図とキャプション
 * 教本図
 *
 * 図（画面のプレビューや表）の直下に、本文より一段小さく薄い文字で説明を
 * 添える。図に付く説明はどのレッスンでもこの書体に揃え、地の文の注記
 * （`GuideNote`）とは分ける — 地の文の注記は本文と同じ大きさで、図の説明は
 * 図の一部として読ませるため。
 */
export function GuideFigure({ caption, children }: GuideFigureProps) {
  return (
    <figure className="space-y-2">
      {children}
      <figcaption className="text-xs leading-relaxed text-surface-500">
        {caption}
      </figcaption>
    </figure>
  );
}
