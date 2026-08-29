import { OutlineIcon } from "./outline-icon";

interface AcademicCapIconProps {
  readonly className?: string;
}

/**
 * 角帽（道場・段級位）アイコン
 * 角帽アイコン
 *
 * 段級位まわりで使っている 🎓 と同じモチーフの線画版。
 */
export function AcademicCapIcon({
  className = "size-5",
}: AcademicCapIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4z" />
      <path d="M6 10.7V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-5.3" />
      <path d="M21.5 8.5V14" />
    </OutlineIcon>
  );
}
