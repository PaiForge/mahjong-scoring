import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import {
  CompactTable,
  CompactTableCell,
  CompactTableHeaderCell,
  CompactTableRow,
} from "./compact-table";
/**
 * KPIカード1枚分のスケルトン
 *
 * 実物のカードは苔緑の太枠（`border-ink`）だが、スケルトンは灰色にする
 * （`ProblemListSkeleton` と同じ理由 — 読み込み中の画面が実物より賑やかに
 * 見えるため）。枠は border-box なので、色だけ替えても高さは実物と一致する。
 */
function StatsCardSkeleton() {
  return (
    <div className="bg-surface-50 border-3 border-surface-100 rounded-lg p-4">
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
    <CompactTable
      head={
        <>
          <CompactTableHeaderCell>
            <SkeletonBar className="h-4 w-16" />
          </CompactTableHeaderCell>
          <CompactTableHeaderCell align="right">
            <SkeletonBar className="h-4 w-12 ml-auto" />
          </CompactTableHeaderCell>
          <CompactTableHeaderCell align="right">
            <SkeletonBar className="h-4 w-12 ml-auto" />
          </CompactTableHeaderCell>
        </>
      }
    >
      {Array.from({ length: 5 }, (_, i) => (
        <CompactTableRow key={i}>
          <CompactTableCell>
            <SkeletonBar className="h-4 w-32" />
          </CompactTableCell>
          <CompactTableCell align="right">
            <SkeletonBar className="h-4 w-8 ml-auto" />
          </CompactTableCell>
          <CompactTableCell align="right">
            <SkeletonBar className="h-4 w-8 ml-auto" />
          </CompactTableCell>
        </CompactTableRow>
      ))}
    </CompactTable>
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
