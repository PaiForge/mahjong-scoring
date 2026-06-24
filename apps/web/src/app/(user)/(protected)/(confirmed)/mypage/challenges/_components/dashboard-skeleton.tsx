/** KPIカード1枚分のスケルトン */
function StatsCardSkeleton() {
  return (
    <div className="bg-surface-50 border border-surface-200 rounded-lg p-4">
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

/** コンテンツ部分のスケルトン（セレクターを除く） */
export function DashboardContentSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <div className="min-w-0 space-y-4">
        <div className="h-6 w-32 bg-surface-200 rounded animate-pulse" />
        <ScoreChartSkeleton />
      </div>

      <div className="space-y-4">
        <div className="h-6 w-28 bg-surface-200 rounded animate-pulse" />
        <SessionHistoryTableSkeleton />
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
      {/* SectionTitle("記録") */}
      <div className="h-7 w-24 animate-pulse rounded bg-surface-200" />
      {/* 期間・メニューセレクタ（実UIは縦積みの block 要素） */}
      <div className="h-[38px] w-full animate-pulse rounded-lg bg-surface-200 sm:w-48" />
      <div className="h-[38px] w-full animate-pulse rounded-lg bg-surface-200 sm:w-64" />
      <DashboardContentSkeleton />
    </div>
  );
}
