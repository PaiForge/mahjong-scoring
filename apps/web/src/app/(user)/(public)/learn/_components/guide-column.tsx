import type { ReactNode } from "react";

import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";

interface GuideColumnProps {
  /** 「コラム」等の分類ラベル（pill で表示する） */
  readonly label: ReactNode;
  /** コラムの見出し */
  readonly title: ReactNode;
  /** コラム本文（段落を並べる） */
  readonly children: ReactNode;
}

/**
 * 教本のコラム
 * 教本コラム
 *
 * 本筋から浮かせて読ませる囲み（{@link HighlightPanel}）に、分類ラベルの pill と
 * 見出しを載せた形。ルール差分・語源・境目の説明など、章の流れを止めずに
 * 添えたい話をここに入れる。
 *
 * 本文は複数段落を想定して `space-y-2` で受ける（段落が1つでも見た目は変わらない）。
 * ラベルと見出しの体裁を章ごとに手書きすると配色や余白が少しずつずれていくため、
 * 一式をこのコンポーネントに集約する。
 */
export function GuideColumn({ label, title, children }: GuideColumnProps) {
  return (
    <HighlightPanel>
      <div className="mb-2 inline-flex items-center rounded-full bg-amber-200/70 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-800">
        {label}
      </div>
      <h3 className="mb-2 text-sm font-semibold text-surface-900">{title}</h3>
      <div className="space-y-2">{children}</div>
    </HighlightPanel>
  );
}
