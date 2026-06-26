import type { ReactNode } from "react";

interface GuideParagraphProps {
  readonly children: ReactNode;
  /** 改行（\n）を保持して表示するか（about-this-app 等の長文向け） */
  readonly preLine?: boolean;
}

/**
 * 教本本文の段落
 * 教本段落
 *
 * 各ガイドで頻出する本文段落のスタイルを一元化する。
 */
export function GuideParagraph({
  children,
  preLine = false,
}: GuideParagraphProps) {
  const className = preLine
    ? "whitespace-pre-line text-sm leading-relaxed text-surface-700"
    : "text-sm leading-relaxed text-surface-700";
  return <p className={className}>{children}</p>;
}
