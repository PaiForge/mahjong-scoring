import type { ReactNode } from "react";

import { TermText } from "@/app/(user)/_components/glossary/term-text";

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
 *
 * 辞書の文字列をそのまま渡した場合は用語マークアップ（`[[slug|表示語]]`）を
 * 解いて用語リンクにする。章側が「この段落は用語を含む」と書き分けなくて
 * 済むよう、判定はここに閉じる — 辞書に印を足すだけでリンクになる。
 */
export function GuideParagraph({
  children,
  preLine = false,
}: GuideParagraphProps) {
  const className = preLine
    ? "whitespace-pre-line text-sm leading-relaxed text-surface-700"
    : "text-sm leading-relaxed text-surface-700";
  return (
    <p className={className}>
      {typeof children === "string" ? (
        <TermText>{children}</TermText>
      ) : (
        children
      )}
    </p>
  );
}
