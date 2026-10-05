import type { ReactNode } from "react";

interface GuideOrderedListProps {
  readonly children: ReactNode;
}

/**
 * 教本の番号リスト
 *
 * これから述べる小見出し（{@link GuideSubsectionTitle}）を導入で先に並べ、
 * 番号で対応づけるために使う。項目の文言は小見出しと同じものを渡す。
 */
export function GuideOrderedList({ children }: GuideOrderedListProps) {
  return (
    <ol className="list-decimal space-y-1 pl-6 text-sm leading-relaxed whitespace-pre-line text-surface-700">
      {children}
    </ol>
  );
}
