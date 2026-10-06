import type { ReactNode } from "react";

/** 実表示と読み込み表示で、文字サイズ・行高・余白を揃える。 */
export const SECTION_TITLE_SHAPE_CLASSES =
  "flex items-center gap-3 py-1.5 text-base font-bold leading-normal tracking-wide md:text-lg";

export const SECTION_TITLE_ACCENT_CLASSES = "h-4 w-1 shrink-0 rounded-full";

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
  /** 左の短い縦線の背景色。段級位の見出しでは帯色を指定する。 */
  accentClass?: string;
}

/** 文字・短いアクセント・淡い横線で、内容を穏やかに区切るセクション見出し。 */
export function SectionTitle({
  children,
  className = "",
  accentClass = "bg-primary-600",
}: SectionTitleProps) {
  return (
    <h2
      className={`${SECTION_TITLE_SHAPE_CLASSES} text-foreground ${className}`}
    >
      <span
        aria-hidden="true"
        className={`${SECTION_TITLE_ACCENT_CLASSES} ${accentClass}`}
      />
      <span className="min-w-0">{children}</span>
      <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-panel" />
    </h2>
  );
}
