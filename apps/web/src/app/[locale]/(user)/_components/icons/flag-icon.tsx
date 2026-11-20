import { OutlineIcon } from "./outline-icon";

interface FlagIconProps {
  readonly className?: string;
}

/** 旗アイコン（問題の誤りを報告する入口の印） */
export function FlagIcon({ className = "size-5" }: FlagIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4L17 12H5" />
    </OutlineIcon>
  );
}
