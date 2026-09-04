import {
  DELTA_TONE_CLASSES,
  formatSignedDelta,
  signedDeltaTone,
} from "@/lib/challenge/signed-delta";

interface ComparisonData {
  /**
   * 前期間との差。統計値と同じ単位（正解数なら「問」）の実数で、比較できる
   * 前期間の値が無ければ undefined（増減行を出さない）。百分率ではない理由は
   * `@/lib/challenge/signed-delta` 参照。
   */
  readonly change: number | undefined;
  /** 「先週比」などの比較対象ラベル */
  readonly label: string;
  /** 表示する小数桁数。`value` 自身の書式に合わせる（既定 0） */
  readonly fractionDigits?: number;
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
export function StatsCard({
  label,
  value,
  tooltip,
  comparison,
}: StatsCardProps) {
  const renderComparison = () => {
    if (!comparison || comparison.change === undefined) return null;

    const { change, label: compLabel, fractionDigits = 0 } = comparison;

    return (
      <p
        className={`text-xs mt-1 ${DELTA_TONE_CLASSES[signedDeltaTone(change, fractionDigits)]}`}
      >
        {compLabel} {formatSignedDelta(change, fractionDigits)}
      </p>
    );
  };

  return (
    <div className="bg-surface-50 border-3 border-ink rounded-lg p-4 min-w-0">
      <p className="text-xs text-surface-500 mb-1">
        {label}
        {tooltip && (
          <span className="relative inline-block ml-1 group">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full border-2 border-ink text-surface-500 cursor-help text-[10px] leading-none"
              aria-label={tooltip}
            >
              i
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded-md bg-surface-800 text-white whitespace-normal w-48 text-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10">
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
