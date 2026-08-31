import { OutlineIcon } from "./outline-icon";

interface ArrowRightIconProps {
  readonly className?: string;
}

/**
 * 右向きの矢印アイコン
 * 右矢印アイコン
 *
 * 軸のある矢印。`ChevronRightIcon` が「この先に続きがある」を示す記号なのに対し、
 * こちらは「A から B へ持っていく」という向きのある関係そのものを描くときに使う。
 */
export function ArrowRightIcon({ className = "size-4" }: ArrowRightIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M4 12h15m0 0l-6-6m6 6l-6 6" />
    </OutlineIcon>
  );
}
