import { OutlineIcon } from "./outline-icon";

interface GridIconProps {
  readonly className?: string;
}

/**
 * タイルの並び（2×2）アイコン
 * グリッドアイコン
 *
 * 点数の入力方式の切り替えでタイル側を表す。面子の `TilesIcon`（3 枚の牌 =
 * 面子分解の導線）とは別物 — 流用すると「面子」と「点数のタイル」で記号の
 * 意味が割れる。
 */
export function GridIcon({ className = "size-5" }: GridIconProps) {
  return (
    <OutlineIcon className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </OutlineIcon>
  );
}
