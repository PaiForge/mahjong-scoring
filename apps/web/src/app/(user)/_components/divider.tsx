interface DividerProps {
  readonly className?: string;
}

/**
 * 内容のまとまりを区切る淡い実線。
 */
export function Divider({ className = "" }: DividerProps) {
  return <hr className={`border-t border-panel ${className}`} />;
}
