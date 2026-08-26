import { OutlineIcon } from "./outline-icon";

interface QuestionMarkCircleIconProps {
  readonly className?: string;
}

/**
 * 疑問符（ヘルプ）アイコン
 * ヘルプアイコン
 */
export function QuestionMarkCircleIcon({
  className = "size-5",
}: QuestionMarkCircleIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75" />
      <path d="M12 17.25h.008v.008H12v-.008Z" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </OutlineIcon>
  );
}
