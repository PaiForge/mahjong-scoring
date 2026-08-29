/**
 * 見た目のバリアント。
 * - `filled`: 濃い緑の pill に白抜き（通常表示）
 * - `placeholder`: 塗りを持たない薄いグレーの pill（読み込み中のスケルトン用）
 */
const VARIANT_CLASS = {
  filled: "bg-primary-700 text-white",
  placeholder: "bg-surface-100",
} as const;

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof VARIANT_CLASS;
  /**
   * 塗りと文字色の差し替え（段級位の帯色など）。省略時はバリアントの既定色。
   *
   * `className` ではなくこちらを使うこと。`className` は既定色の後ろに
   * 連結されるだけで、どちらが勝つかは Tailwind が出力する CSS の順序次第に
   * なる（`bg-primary-700` と `bg-orange-500` が両方載った状態になる）。
   */
  toneClass?: string;
}

/**
 * セクション見出し。濃い緑の pill に白抜きで置き、右下にオフセット影を落とす。
 * 下線ではなく塊として見せることで、太枠のカードと同じ骨格に揃う。
 */
export function SectionTitle({
  children,
  className = "",
  variant = "filled",
  toneClass,
}: SectionTitleProps) {
  // 影はスケルトンだけ持たない（実物の色が決まっていない段階で影だけ落ちると浮く）
  const shadow = variant === "placeholder" ? "" : "shadow-xs";

  return (
    <h2
      className={`inline-block rounded-full px-5 py-1.5 text-base md:text-lg font-bold leading-normal ${toneClass ?? VARIANT_CLASS[variant]} ${shadow} ${className}`}
    >
      {children}
    </h2>
  );
}
