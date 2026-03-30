interface ChevronRightIconProps {
  readonly className?: string;
}

/**
 * 右矢印アイコン
 * 右シェブロンアイコン
 */
export function ChevronRightIcon({ className = "size-4" }: ChevronRightIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
