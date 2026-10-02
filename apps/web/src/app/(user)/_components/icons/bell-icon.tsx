import { OutlineIcon } from "./outline-icon";

interface BellIconProps {
  readonly className?: string;
}

/** ベルアイコン（通知の印） */
export function BellIcon({ className = "size-5" }: BellIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M15 17H5l1.4-1.4a2 2 0 00.6-1.4V10a5 5 0 0110 0v4.2a2 2 0 00.6 1.4L19 17h-4" />
      <path d="M10 20a2 2 0 004 0" />
    </OutlineIcon>
  );
}
