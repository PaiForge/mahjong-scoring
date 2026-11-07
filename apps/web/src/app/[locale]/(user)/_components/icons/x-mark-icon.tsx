import { OutlineIcon } from "./outline-icon";

interface XMarkIconProps {
  readonly className?: string;
}

/** バツ印アイコン */
export function XMarkIcon({ className = "size-4" }: XMarkIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </OutlineIcon>
  );
}
