import type { ReactNode } from "react";

/**
 * 教本本文の注記
 *
 * 本文（`GuideParagraph`）より一段トーンを落とした補足。本筋を追う読者が
 * 読み飛ばせるように、文字色だけを薄くして地の文と区別する。
 * 「※」のような行頭記号は文言側（辞書）に持たせる。
 */
export function GuideNote({ children }: { readonly children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-surface-500">{children}</p>;
}
