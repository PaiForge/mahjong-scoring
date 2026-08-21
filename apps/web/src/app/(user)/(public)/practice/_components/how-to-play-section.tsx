import type { ReactNode } from "react";

import { SectionTitle } from "@/app/_components/section-title";

interface HowToPlaySectionProps {
  /** セクション見出し（<namespace>.howToPlay.title） */
  readonly title: string;
  /** 見出し下のリード文（<namespace>.howToPlay.lead） */
  readonly lead: string;
  /** 枠の中に置く問題方式デモ */
  readonly children: ReactNode;
}

/**
 * 練習の「問題方式」セクション
 * 問題方式セクション
 *
 * 見出し + リード文 + デモを囲む枠。説明ページと設定ページで共通。
 */
export function HowToPlaySection({
  title,
  lead,
  children,
}: HowToPlaySectionProps) {
  return (
    <div className="space-y-4">
      <SectionTitle>{title}</SectionTitle>
      <p className="text-sm text-surface-600">{lead}</p>
      <div className="rounded-xl border-3 border-ink bg-surface-50 p-6">
        {children}
      </div>
    </div>
  );
}
