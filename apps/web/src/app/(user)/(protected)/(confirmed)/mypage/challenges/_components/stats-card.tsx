interface ComparisonData {
  readonly percentChange: number | undefined;
  readonly absoluteChange: number | undefined;
  readonly label: string;
}

interface StatsCardProps {
  readonly label: string;
  readonly value: string;
  readonly tooltip?: string;
  readonly comparison?: ComparisonData;
}

/**
 * KPI表示カード。ベストスコアや平均スコアなどの統計値を表示する。
 * 統計カード
 */
export function StatsCard({ label, value, tooltip, comparison }: StatsCardProps) {
  const renderComparison = () => {
    if (!comparison) return null;

    const { percentChange, absoluteChange, label: compLabel } = comparison;

    if (percentChange === undefined && absoluteChange === undefined) return null;

    const displayValue =
      percentChange !== undefined
        ? `${Math.abs(Math.round(percentChange * 10) / 10)}%`
        : `${Math.abs(absoluteChange ?? 0)}`;

    const changeValue = percentChange ?? absoluteChange ?? 0;

    if (changeValue === 0) {
      return (
        <p className="text-xs text-muted-foreground mt-1">
          &mdash; {compLabel}
        </p>
      );
    }

    const isPositive = changeValue > 0;

    return (
      <p
        className={`text-xs mt-1 ${isPositive ? "text-green-600" : "text-red-500"}`}
      >
        {isPositive ? "\u25B2" : "\u25BC"} {displayValue} {compLabel}
      </p>
    );
  };

  return (
    <div className="bg-surface-50 border border-surface-200 rounded-lg p-4 shadow-sm min-w-0">
      <p className="text-xs text-surface-500 mb-1">
        {label}
        {tooltip && (
          <span className="relative inline-block ml-1 group">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-surface-400 text-surface-500 cursor-help text-[10px] leading-none"
              aria-label={tooltip}
            >
              i
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded bg-surface-800 text-white whitespace-normal w-48 text-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10">
              {tooltip}
            </span>
          </span>
        )}
      </p>
      <p className="text-2xl font-bold text-surface-900">{value}</p>
      {renderComparison()}
    </div>
  );
}
