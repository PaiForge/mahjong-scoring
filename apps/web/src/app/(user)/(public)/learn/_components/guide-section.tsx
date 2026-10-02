import type { ReactNode } from "react";

import { SectionTitle } from "@/app/(user)/_components/section-title";

interface GuideSectionProps {
  /** 節の見出し（h2） */
  readonly title: ReactNode;
  readonly children: ReactNode;
}

/**
 * 教本本文の節（見出し + 本文）
 * 教本節
 *
 * 各ガイドで頻出する「見出しの pill の下に段落・表を並べる」節の
 * 骨格と間隔を一元化する。
 */
export function GuideSection({ title, children }: GuideSectionProps) {
  return (
    <section className="space-y-4">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  );
}
