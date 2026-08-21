import { SectionTitleSkeleton } from "@/app/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
/** KPIカード1枚分のスケルトン */
function StatsCardSkeleton() {
  return (
    <div className="bg-surface-50 border-3 border-ink rounded-lg p-4">
      <SkeletonBar className="h-3 w-20 mb-3" />
      <SkeletonBar className="h-8 w-16 mb-2" />
      <SkeletonBar className="h-3 w-28" />
    </div>
  );
}

/** スコアトレンドチャートのスケルトン */
function ScoreChartSkeleton() {
  return <SkeletonBar radius="lg" className="h-[250px] w-full" />;
}

/** セッション履歴テーブルのスケルトン */
function SessionHistoryTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-3 border-ink">
            <th className="text-left py-2 px-2 sm:px-3">
              <SkeletonBar className="h-4 w-16" />
            </th>
            <th className="text-right py-2 px-2 sm:px-3">
              <SkeletonBar className="h-4 w-12 ml-auto" />
            </th>
            <th className="text-right py-2 px-2 sm:px-3">
              <SkeletonBar className="h-4 w-12 ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr key={i} className="border-b-2 border-dashed border-border/40">
              <td className="py-2 px-2 sm:px-3">
                <SkeletonBar className="h-4 w-32" />
              </td>
              <td className="py-2 px-2 sm:px-3">
                <SkeletonBar className="h-4 w-8 ml-auto" />
              </td>
              <td className="py-2 px-2 sm:px-3">
                <SkeletonBar className="h-4 w-8 ml-auto" />
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
        <SkeletonBar className="h-6 w-32" />
        <ScoreChartSkeleton />
      </div>

      <div className="space-y-4">
        <SkeletonBar className="h-6 w-28" />
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
      <SectionTitleSkeleton width="w-24" />
      {/* 期間・メニューセレクタ（実UIは縦積みの block 要素） */}
      <SkeletonBar radius="lg" className="h-[38px] w-full sm:w-48" />
      <SkeletonBar radius="lg" className="h-[38px] w-full sm:w-64" />
      <DashboardContentSkeleton />
    </div>
  );
}
