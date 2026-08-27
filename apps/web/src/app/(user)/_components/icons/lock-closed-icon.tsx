import { OutlineIcon } from "./outline-icon";

interface LockClosedIconProps {
  readonly className?: string;
}

/**
 * 閉じた南京錠のアイコン（🔒）
 * 施錠アイコン
 *
 * 「今は触っても動かない」状態を表す。開いた `LockOpenIcon` と対で使い、
 * 掛け金の向きだけが違う同じ錠前に見えるよう、本体の矩形は同じ寸法にする。
 */
export function LockClosedIcon({ className = "size-5" }: LockClosedIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <rect x="4" y="11" width="16" height="10" rx="2" />
    </OutlineIcon>
  );
}
