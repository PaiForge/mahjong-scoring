import {
  SECTION_TITLE_ACCENT_CLASSES,
  SECTION_TITLE_SHAPE_CLASSES,
} from "./section-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

interface SectionTitleSkeletonProps {
  /** プレースホルダーバーの幅（Tailwind の `w-*` クラス） */
  readonly width?: string;
}

/**
 * 見出しと同じ行高・余白を持つ読み込み表示。
 * 空の見出しが文書に現れないよう、h2 ではなく div として描画する。
 */
export function SectionTitleSkeleton({
  width = "w-24",
}: SectionTitleSkeletonProps) {
  return (
    <div aria-hidden="true" className={SECTION_TITLE_SHAPE_CLASSES}>
      <span className={`${SECTION_TITLE_ACCENT_CLASSES} bg-surface-100`} />
      <span className="relative min-w-0">
        <span className={`block ${width}`}>&nbsp;</span>
        <SkeletonBar
          className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2"
          tone={100}
        />
      </span>
      <span className="h-px min-w-4 flex-1 bg-surface-100" />
    </div>
  );
}
