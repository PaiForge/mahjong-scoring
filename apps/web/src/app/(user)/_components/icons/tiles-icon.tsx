import { OutlineIcon } from "./outline-icon";

interface TilesIconProps {
  readonly className?: string;
}

/**
 * 牌の並び（縦3列）アイコン
 * 牌アイコン
 *
 * 3枚並んだ牌 = 面子を模した図形。面子分解の導線に使う。
 */
export function TilesIcon({ className = "size-5" }: TilesIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M9 6v12m6-12v12M5 18h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </OutlineIcon>
  );
}
