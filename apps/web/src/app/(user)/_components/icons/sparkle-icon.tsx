interface SparkleIconProps {
  readonly className?: string;
}

/** 4 本の光のきらめき（塗り）。Pro バッジの印 */
export function SparkleIcon({ className = "size-3" }: SparkleIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2c.4 4.9 2.6 7.6 8 10-5.4 2.4-7.6 5.1-8 10-.4-4.9-2.6-7.6-8-10 5.4-2.4 7.6-5.1 8-10Z" />
    </svg>
  );
}
