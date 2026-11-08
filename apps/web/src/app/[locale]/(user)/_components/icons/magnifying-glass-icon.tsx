import { OutlineIcon } from "./outline-icon";

interface MagnifyingGlassIconProps {
  readonly className?: string;
}

/**
 * 虫眼鏡（調べる）アイコン
 * 検索アイコン
 */
export function MagnifyingGlassIcon({
  className = "size-5",
}: MagnifyingGlassIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </OutlineIcon>
  );
}
