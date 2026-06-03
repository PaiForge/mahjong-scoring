interface InfinityIconProps {
  readonly className?: string;
}

/** 無限大アイコン（トレーニングモード用） */
export function InfinityIcon({ className = "size-5" }: InfinityIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M6.5 7.5a4.5 4.5 0 1 0 0 9c2.5 0 4-2.5 5.5-4.5s3-4.5 5.5-4.5a4.5 4.5 0 1 1 0 9c-2.5 0-4-2.5-5.5-4.5S9 7.5 6.5 7.5Z" />
    </svg>
  );
}
