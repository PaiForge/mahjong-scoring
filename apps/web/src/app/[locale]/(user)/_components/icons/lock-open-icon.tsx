import { OutlineIcon } from "./outline-icon";

interface LockOpenIconProps {
  readonly className?: string;
}

/**
 * 開いた南京錠のアイコン（🔓）
 * 解錠アイコン
 *
 * 「今は触ると動く」状態を表す。閉じた `LockClosedIcon` と対で使う。
 * 掛け金を左に振って開いていることを示し、本体の矩形は閉錠側と同寸にする。
 */
export function LockOpenIcon({ className = "size-5" }: LockOpenIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      <rect x="4" y="11" width="16" height="10" rx="2" />
    </OutlineIcon>
  );
}
