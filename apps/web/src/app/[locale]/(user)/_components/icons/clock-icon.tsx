import { OutlineIcon } from "./outline-icon";

interface ClockIconProps {
  readonly className?: string;
}

/** 時計アイコン（時間切れの印） */
export function ClockIcon({ className = "size-4" }: ClockIconProps) {
  return (
    <OutlineIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </OutlineIcon>
  );
}
