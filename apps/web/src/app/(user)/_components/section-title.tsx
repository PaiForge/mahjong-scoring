/**
 * pill の形（塗り以外）。
 *
 * `SectionTitle`（本物）と `SectionTitleSkeleton`（読み込み中）で共有する。
 * 読み込み中の見出しは `h2` を名乗れない — loading.tsx の中身は Suspense の
 * フォールバックとして初期 HTML に焼き込まれるため、`h2` で描くと中身が空の
 * 見出しが本物より先に文書へ出る。同じ箱を別の要素で作れるよう、形は
 * ここに出して両者で読む（固定の `h-*` で近似すると、フォントサイズと
 * pill の余白に由来する高さがブレークポイントごとにずれる）。
 */
export const SECTION_TITLE_SHAPE_CLASSES =
  "inline-block rounded-full px-5 py-1.5 text-base md:text-lg font-bold leading-normal";

/** 通常表示の塗り。濃い緑に白抜き */
const SECTION_TITLE_TONE = "bg-primary-700 text-white";

/** 読み込み中の塗り。pill の濃い緑と影は読み込み中に主張しすぎるため薄いグレーにする */
export const SECTION_TITLE_PLACEHOLDER_TONE = "bg-surface-100";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  /**
   * 塗りと文字色の差し替え（段級位の帯色など）。省略時は既定色。
   *
   * `className` ではなくこちらを使うこと。`className` は既定色の後ろに
   * 連結されるだけで、どちらが勝つかは Tailwind が出力する CSS の順序次第に
   * なる（`bg-primary-700` と `bg-orange-500` が両方載った状態になる）。
   */
  toneClass?: string;
}

/**
 * セクション見出し。濃い緑の pill に白抜きで置く。
 * 下線ではなく塊として見せることで、太枠のカードと同じ骨格に揃う。
 */
export function SectionTitle({
  children,
  className = "",
  toneClass,
}: SectionTitleProps) {
  return (
    <h2
      className={`${SECTION_TITLE_SHAPE_CLASSES} ${toneClass ?? SECTION_TITLE_TONE} ${className}`}
    >
      {children}
    </h2>
  );
}
