import { OutlineIcon } from "./outline-icon";

interface DevicePhoneIconProps {
  readonly className?: string;
}

/**
 * スマートフォンのアイコン
 * スマホアイコン
 */
export function DevicePhoneIcon({
  className = "size-5",
}: DevicePhoneIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zm3 16h2" />
    </OutlineIcon>
  );
}
