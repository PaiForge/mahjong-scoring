import { SkeletonBar } from "./skeleton-bar";

interface PageTitleSkeletonProps {
  /** プレースホルダーバーの幅（Tailwind の `w-*` クラス） */
  readonly width?: string;
}

/**
 * ページ見出しの読み込み中プレースホルダー
 * ページ見出しスケルトン
 *
 * `PageTitlePlaceholder` / `AdminPageTitlePlaceholder` の中で使う。見出しと同じ
 * 箱に包まれることで、実描画と同じ全幅のグレー帯（高さ・余白）を再現し CLS を
 * 防ぐ。`PageTitle` / `AdminPageTitle`（本物の見出し要素）の子には置かない —
 * 空の h1 / h2 が本物より先に初期 HTML へ出てしまう。
 *
 * 行ボックスに乗せるため `span` + `inline-block` + `align-middle` で描画する。
 * ブロック要素にすると見出しの行高から外れて高さがずれる。
 */
export function PageTitleSkeleton({ width = "w-48" }: PageTitleSkeletonProps) {
  return (
    <SkeletonBar
      as="span"
      tone={300}
      className={`inline-block h-7 ${width} align-middle`}
    />
  );
}
