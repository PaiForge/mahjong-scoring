interface PlayIconProps {
  readonly className?: string;
}

/** 再生アイコン */
export function PlayIcon({ className = "size-5" }: PlayIconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}
