import { OutlineIcon } from "./outline-icon";

interface DropdownIconProps {
  readonly className?: string;
}

/**
 * 選択欄（ドロップダウン）アイコン
 * ドロップダウンアイコン
 *
 * 角丸の矩形の中に下向きの山形 = select の欄を模した図形。点数の入力方式の
 * 切り替えで select 側を表す。
 */
export function DropdownIcon({ className = "size-5" }: DropdownIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path d="M9 11l3 3 3-3" />
    </OutlineIcon>
  );
}
