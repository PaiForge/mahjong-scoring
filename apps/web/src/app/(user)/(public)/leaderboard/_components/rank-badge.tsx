interface RankBadgeProps {
  readonly rank: number;
}

const PODIUM_STYLES: Record<number, string> = {
  1: 'bg-amber-100 text-amber-800 font-bold',
  2: 'bg-gray-100 text-gray-600 font-bold',
  3: 'bg-orange-100 text-orange-700 font-bold',
};

/**
 * 順位バッジ
 * 上位3位に特別なスタイルを適用する順位表示コンポーネント
 */
export function RankBadge({ rank }: RankBadgeProps) {
  const podiumStyle = PODIUM_STYLES[rank];

  if (podiumStyle) {
    return (
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm ${podiumStyle}`}
      >
        {rank}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-surface-400 text-sm font-medium">
      {rank}
    </span>
  );
}
