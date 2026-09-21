import { SectionTitle } from "@/app/(user)/_components/section-title";

interface TermSectionProps {
  readonly title: string;
  /** 本文。改行（`\n`）で段落を分ける */
  readonly body: string;
}

/**
 * 用語ページの本文 1 節（点数計算での扱い・具体例・よくある誤解）
 * 用語の節
 *
 * 辞書の文字列を改行で段落に分けて描く。節の順序と見出しはページ側が決め、
 * ここは「見出し + 段落の並び」という形だけを持つ。
 */
export function TermSection({ title, body }: TermSectionProps) {
  return (
    <section className="space-y-4">
      <SectionTitle>{title}</SectionTitle>
      {body.split("\n").map((paragraph, index) => (
        <p key={index} className="text-sm leading-relaxed text-surface-700">
          {paragraph}
        </p>
      ))}
    </section>
  );
}
