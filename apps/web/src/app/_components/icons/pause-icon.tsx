interface PauseIconProps {
  readonly className?: string;
}

/** 一時停止アイコン */
export function PauseIcon({ className = "size-5" }: PauseIconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
