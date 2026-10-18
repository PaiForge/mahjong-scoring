import { OutlineIcon } from "./outline-icon";

interface EllipsisHorizontalIconProps {
  readonly className?: string;
}

/** 横並びの三点（「…」）アイコン */
export function EllipsisHorizontalIcon({
  className = "size-5",
}: EllipsisHorizontalIconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </OutlineIcon>
  );
}
