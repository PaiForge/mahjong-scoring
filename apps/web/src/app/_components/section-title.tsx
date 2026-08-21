interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * セクション見出し。濃い緑の pill に白抜きで置き、右下にオフセット影を落とす。
 * 下線ではなく塊として見せることで、太枠のカードと同じ骨格に揃う。
 */
export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <h2
      className={`inline-block rounded-full bg-primary-700 px-5 py-1.5 text-base md:text-lg font-bold leading-normal text-white shadow-xs ${className}`}
    >
      {children}
    </h2>
  );
}
