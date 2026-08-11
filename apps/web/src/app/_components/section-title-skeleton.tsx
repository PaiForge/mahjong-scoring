import { SectionTitle } from "./section-title";

interface SectionTitleSkeletonProps {
  /** プレースホルダーバーの幅（Tailwind の `w-*` クラス） */
  readonly width?: string;
}

/**
 * SectionTitle の読み込み中プレースホルダー
 * セクション見出しスケルトン
 *
 * `SectionTitle` 自体を使って描画するため、フォントサイズ（`text-base md:text-lg`）
 * や下線（`border-b-2 pb-2`）に由来する高さが実物と必ず一致する。固定の `h-*` で
 * 近似すると実物より低くなり、ブレークポイントごとにもずれるため使わない。
 *
 * 中身の `&nbsp;` は 1 行分の行ボックスを作るためのもので、幅を持つバーの背景色は
 * その行ボックスいっぱいに乗る。下線は控えめなグレーに置き換える。
 */
export function SectionTitleSkeleton({
  width = "w-24",
}: SectionTitleSkeletonProps) {
  return (
    <SectionTitle className="border-surface-200">
      <span
        className={`inline-block animate-pulse rounded bg-surface-200 ${width}`}
      >
        &nbsp;
      </span>
    </SectionTitle>
  );
}
