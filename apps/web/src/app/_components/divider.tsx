interface DividerProps {
  readonly className?: string;
}

/**
 * 水平区切り線（blindfold-chess の Divider 準拠）。
 */
export function Divider({ className = "" }: DividerProps) {
  return <hr className={`border-t border-border ${className}`} />;
}
