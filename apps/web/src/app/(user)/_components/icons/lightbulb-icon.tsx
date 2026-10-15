import { OutlineIcon } from "./outline-icon";

interface LightbulbIconProps {
  readonly className?: string;
}

/** 電球（ヒント）アイコン */
export function LightbulbIcon({ className = "size-4" }: LightbulbIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4" />
    </OutlineIcon>
  );
}
