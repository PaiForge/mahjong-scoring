import { SkeletonBar } from "./skeleton-bar";

interface PageTitleSkeletonProps {
  /** プレースホルダーバーの幅（Tailwind の `w-*` クラス） */
  readonly width?: string;
}

/**
 * ページ見出しの読み込み中プレースホルダー
 * ページ見出しスケルトン
 *
 * `PageTitle` / `AdminPageTitle` の子として置く。見出しコンポーネント自体に
 * 包ませることで、実描画と同じ全幅のグレー帯（高さ・余白）を再現し CLS を防ぐ。
 * そのため単体では使わず、必ず見出しの内側に置くこと。
 *
 * 行ボックスに乗せるため `span` + `inline-block` + `align-middle` で描画する。
 * ブロック要素にすると見出しの行高から外れて高さがずれる。
 */
export function PageTitleSkeleton({ width = "w-48" }: PageTitleSkeletonProps) {
  return (
    <SkeletonBar
      as="span"
      tone={300}
      className={`inline-block h-7 ${width} rounded align-middle`}
    />
  );
}
