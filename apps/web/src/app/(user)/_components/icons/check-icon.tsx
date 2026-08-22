interface CheckIconProps {
  readonly className?: string;
  readonly "aria-label"?: string;
  readonly "data-testid"?: string;
}

/** チェックアイコン */
export function CheckIcon({
  className = "size-4",
  "aria-label": ariaLabel,
  "data-testid": dataTestId,
}: CheckIconProps) {
  const labelled = ariaLabel !== undefined;
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      data-testid={dataTestId}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? ariaLabel : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
