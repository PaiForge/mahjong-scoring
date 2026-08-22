import { OutlineIcon } from "./outline-icon";

interface DumbbellIconProps {
  readonly className?: string;
}

/**
 * ダンベル（練習）アイコン
 * 練習アイコン
 */
export function DumbbellIcon({ className = "size-5" }: DumbbellIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M2 12h1M5 9v6M8 7v10M16 7v10M19 9v6M22 12h-1M8 12h8" />
    </OutlineIcon>
  );
}
