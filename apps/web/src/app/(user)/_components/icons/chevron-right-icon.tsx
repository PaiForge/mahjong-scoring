import { OutlineIcon } from "./outline-icon";

interface ChevronRightIconProps {
  readonly className?: string;
}

/**
 * 右矢印アイコン
 * 右シェブロンアイコン
 */
export function ChevronRightIcon({
  className = "size-4",
}: ChevronRightIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M9 5l7 7-7 7" />
    </OutlineIcon>
  );
}
