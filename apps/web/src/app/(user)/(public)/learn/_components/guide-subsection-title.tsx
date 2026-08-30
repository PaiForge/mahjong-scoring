import type { ReactNode } from "react";

interface GuideSubsectionTitleProps {
  readonly children: ReactNode;
  /** 見出しの左に置く番号。導入の番号リストと対応づけたいときに渡す */
  readonly number?: number;
}

/**
 * 教本の小見出し（h3）
 *
 * SectionTitle（h2）が濃い緑の pill で「塊」として立つのに対し、
 * こちらは緑の丸バッジ + 素のテキストで一段下の階層に見せる。
 * 番号を渡すと、導入の番号リストと見出しが番号で対応する。
 */
export function GuideSubsectionTitle({
  children,
  number,
}: GuideSubsectionTitleProps) {
  return (
    <h3 className="flex items-start gap-3 text-base font-bold text-surface-900">
      {number !== undefined && (
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm text-white"
        >
          {number}
        </span>
      )}
      <span className="pt-0.5 leading-normal">{children}</span>
    </h3>
  );
}
