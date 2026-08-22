/**
 * 見た目のバリアント。
 * - `filled`: 濃い緑の pill に白抜き（通常表示）
 * - `placeholder`: 塗りと影を持たない薄いグレーの pill（読み込み中のスケルトン用）
 */
const VARIANT_CLASS = {
  filled: "bg-primary-700 text-white shadow-xs",
  placeholder: "bg-surface-100",
} as const;

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof VARIANT_CLASS;
}

/**
 * セクション見出し。濃い緑の pill に白抜きで置き、右下にオフセット影を落とす。
 * 下線ではなく塊として見せることで、太枠のカードと同じ骨格に揃う。
 */
export function SectionTitle({
  children,
  className = "",
  variant = "filled",
}: SectionTitleProps) {
  return (
    <h2
      className={`inline-block rounded-full px-5 py-1.5 text-base md:text-lg font-bold leading-normal ${VARIANT_CLASS[variant]} ${className}`}
    >
      {children}
    </h2>
  );
}
