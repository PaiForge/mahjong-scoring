import { SectionTitle } from "./section-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

interface SectionTitleSkeletonProps {
  /** プレースホルダーバーの幅（Tailwind の `w-*` クラス） */
  readonly width?: string;
}

/**
 * SectionTitle の読み込み中プレースホルダー
 * セクション見出しスケルトン
 *
 * `SectionTitle` 自体を使って描画するため、フォントサイズ（`text-base md:text-lg`）
 * や pill の余白（`px-5 py-1.5`）に由来する高さが実物と必ず一致する。固定の `h-*` で
 * 近似すると実物より低くなり、ブレークポイントごとにもずれるため使わない。
 *
 * 中身の `&nbsp;` は 1 行分の行ボックスを作るためのもの。pill の塗りと影は
 * 読み込み中に主張しすぎるため、`placeholder` バリアントで薄いグレーにする。
 */
export function SectionTitleSkeleton({
  width = "w-24",
}: SectionTitleSkeletonProps) {
  return (
    <SectionTitle variant="placeholder">
      <SkeletonBar as="span" className={`inline-block ${width}`}>
        &nbsp;
      </SkeletonBar>
    </SectionTitle>
  );
}
