import {
  SECTION_TITLE_PLACEHOLDER_TONE,
  SECTION_TITLE_SHAPE_CLASSES,
} from "./section-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

interface SectionTitleSkeletonProps {
  /** プレースホルダーバーの幅（Tailwind の `w-*` クラス） */
  readonly width?: string;
}

/**
 * SectionTitle の読み込み中プレースホルダー
 * セクション見出しスケルトン
 *
 * `SectionTitle` と同じ形のクラス（`SECTION_TITLE_SHAPE_CLASSES`）を貼るため、
 * フォントサイズや pill の余白に由来する高さが実物と必ず一致する。固定の `h-*` で
 * 近似すると実物より低くなり、ブレークポイントごとにもずれるため使わない。
 *
 * 見出し要素（h2）は名乗らない。loading.tsx の中身は Suspense のフォールバック
 * として初期 HTML に焼き込まれるため、`h2` で描くと中身が空の見出しが本物より
 * 先に文書へ出る（`PageTitlePlaceholder` と同じ理由）。
 *
 * 中身の `&nbsp;` は 1 行分の行ボックスを作るためのもの。
 */
export function SectionTitleSkeleton({
  width = "w-24",
}: SectionTitleSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`${SECTION_TITLE_SHAPE_CLASSES} ${SECTION_TITLE_PLACEHOLDER_TONE}`}
    >
      <SkeletonBar as="span" className={`inline-block ${width}`}>
        &nbsp;
      </SkeletonBar>
    </div>
  );
}
