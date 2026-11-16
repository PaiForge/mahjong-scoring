import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { DateRangePickerSkeleton } from "@/app/admin/_components/date-range-picker-skeleton";
import { TableSkeleton } from "@/app/admin/_components/table-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { LESSON_CHAPTERS } from "@mahjong-scoring/features/curriculum/registry";

/**
 * レッスンの完了状況のローディング状態
 * ローディング
 *
 * 実体（タイトル → 説明 → 期間ピッカー → KPI 2 枚 → 並び順のタブ → 表）の
 * 構造・余白に合わせて CLS を防ぐ。表の行数はレジストリのレッスン数
 * （レジストリに無い slug の行は DB を読むまで分からないので数えない）。
 */
export default function AdminLessonStatsLoading() {
  return (
    <>
      <AdminPageTitlePlaceholder width="w-48" className="mb-2" />
      <div className="mb-6 space-y-1">
        <SkeletonBar className="h-5 w-full max-w-2xl" tone={100} />
        <SkeletonBar className="h-5 w-2/3 max-w-md" tone={100} />
      </div>

      <div className="space-y-6">
        <DateRangePickerSkeleton />

        {/* KPI 2 枚 */}
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <section key={i} className="admin-kpi space-y-2">
              <SkeletonBar className="h-5 w-40" tone={100} />
              <SkeletonBar className="h-14 w-20" />
              <SkeletonBar className="h-4 w-24" tone={100} />
              <SkeletonBar className="h-4 w-48" tone={100} />
            </section>
          ))}
        </div>

        {/* 並び順のタブ */}
        <div className="admin-tabs" aria-hidden="true">
          <SkeletonBar className="my-2 h-5 w-16" tone={100} />
          <SkeletonBar className="my-2 h-5 w-24" tone={100} />
          <SkeletonBar className="my-2 h-5 w-24" tone={100} />
        </div>

        <TableSkeleton columns={5} rows={LESSON_CHAPTERS.length} />
      </div>
    </>
  );
}
