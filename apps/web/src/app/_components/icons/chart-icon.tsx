interface ChartIconProps {
  readonly className?: string;
}

/**
 * チャート（ランキング）アイコン
 * チャートアイコン
 */
export function ChartIcon({ className = "size-5" }: ChartIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
