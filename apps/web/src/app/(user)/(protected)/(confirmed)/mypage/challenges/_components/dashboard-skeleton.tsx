/** KPIカード1枚分のスケルトン */
function StatsCardSkeleton() {
  return (
    <div className="bg-surface-50 border border-surface-200 rounded-lg p-4 shadow-sm">
      <div className="h-3 w-20 mb-3 bg-surface-200 rounded animate-pulse" />
      <div className="h-8 w-16 mb-2 bg-surface-200 rounded animate-pulse" />
      <div className="h-3 w-28 bg-surface-200 rounded animate-pulse" />
    </div>
  );
}

/** スコアトレンドチャートのスケルトン */
function ScoreChartSkeleton() {
  return (
    <div className="h-[250px] w-full rounded-lg bg-surface-200 animate-pulse" />
  );
}

/** セッション履歴テーブルのスケルトン */
function SessionHistoryTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            <th className="text-left py-2 px-2 sm:px-3">
              <div className="h-4 w-16 bg-surface-200 rounded animate-pulse" />
            </th>
            <th className="text-right py-2 px-2 sm:px-3">
              <div className="h-4 w-12 ml-auto bg-surface-200 rounded animate-pulse" />
            </th>
            <th className="text-right py-2 px-2 sm:px-3">
              <div className="h-4 w-12 ml-auto bg-surface-200 rounded animate-pulse" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr key={i} className="border-b border-surface-100">
              <td className="py-2 px-2 sm:px-3">
                <div className="h-4 w-32 bg-surface-200 rounded animate-pulse" />
              </td>
              <td className="py-2 px-2 sm:px-3">
                <div className="h-4 w-8 ml-auto bg-surface-200 rounded animate-pulse" />
              </td>
              <td className="py-2 px-2 sm:px-3">
                <div className="h-4 w-8 ml-auto bg-surface-200 rounded animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 期間セレクターのスケルトン */
function PeriodSelectorSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="w-full sm:w-48 h-[38px] rounded-lg bg-surface-200 animate-pulse" />
      <div className="w-full sm:w-64 h-[38px] rounded-lg bg-surface-200 animate-pulse" />
    </div>
  );
}

/** コンテンツ部分のスケルトン（セレクターを除く） */
export function DashboardContentSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <div className="min-w-0">
        <div className="h-6 w-32 mb-4 bg-surface-200 rounded animate-pulse" />
        <div className="mt-4">
          <ScoreChartSkeleton />
        </div>
      </div>

      <div>
        <div className="h-6 w-28 mb-4 bg-surface-200 rounded animate-pulse" />
        <div className="mt-4">
          <SessionHistoryTableSkeleton />
        </div>
      </div>
    </>
  );
}

/**
 * ダッシュボード全体のスケルトン（セレクター含む）
 * ダッシュボードスケルトン
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PeriodSelectorSkeleton />
      <DashboardContentSkeleton />
    </div>
  );
}
