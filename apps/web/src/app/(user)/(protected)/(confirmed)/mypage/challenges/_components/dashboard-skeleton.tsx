import { SkeletonBar } from "@/app/_components/skeleton-bar";
/** KPIカード1枚分のスケルトン */
function StatsCardSkeleton() {
  return (
    <div className="bg-surface-50 border border-surface-200 rounded-lg p-4">
      <SkeletonBar className="h-3 w-20 mb-3 rounded" />
      <SkeletonBar className="h-8 w-16 mb-2 rounded" />
      <SkeletonBar className="h-3 w-28 rounded" />
    </div>
  );
}

/** スコアトレンドチャートのスケルトン */
function ScoreChartSkeleton() {
  return <SkeletonBar className="h-[250px] w-full rounded-lg" />;
}

/** セッション履歴テーブルのスケルトン */
function SessionHistoryTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            <th className="text-left py-2 px-2 sm:px-3">
              <SkeletonBar className="h-4 w-16 rounded" />
            </th>
            <th className="text-right py-2 px-2 sm:px-3">
              <SkeletonBar className="h-4 w-12 ml-auto rounded" />
            </th>
            <th className="text-right py-2 px-2 sm:px-3">
              <SkeletonBar className="h-4 w-12 ml-auto rounded" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr key={i} className="border-b border-surface-100">
              <td className="py-2 px-2 sm:px-3">
                <SkeletonBar className="h-4 w-32 rounded" />
              </td>
              <td className="py-2 px-2 sm:px-3">
                <SkeletonBar className="h-4 w-8 ml-auto rounded" />
              </td>
              <td className="py-2 px-2 sm:px-3">
                <SkeletonBar className="h-4 w-8 ml-auto rounded" />
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
        <SkeletonBar className="h-6 w-32 rounded" />
        <ScoreChartSkeleton />
      </div>

      <div className="space-y-4">
        <SkeletonBar className="h-6 w-28 rounded" />
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
      <SkeletonBar className="h-7 w-24 rounded" />
      {/* 期間・メニューセレクタ（実UIは縦積みの block 要素） */}
      <SkeletonBar className="h-[38px] w-full rounded-lg sm:w-48" />
      <SkeletonBar className="h-[38px] w-full rounded-lg sm:w-64" />
      <DashboardContentSkeleton />
    </div>
  );
}
