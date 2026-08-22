import { OutlineIcon } from "./outline-icon";

interface TableIconProps {
  readonly className?: string;
}

/**
 * 表（テーブル）アイコン
 * テーブルアイコン
 */
export function TableIcon({ className = "size-5" }: TableIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </OutlineIcon>
  );
}
