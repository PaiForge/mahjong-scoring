import { OutlineIcon } from "./outline-icon";

interface RotateCcwIconProps {
  readonly className?: string;
}

/**
 * 反時計回りの円形矢印アイコン
 * やり直しアイコン
 */
export function RotateCcwIcon({ className = "size-5" }: RotateCcwIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </OutlineIcon>
  );
}
