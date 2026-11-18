import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { DateRangePickerSkeleton } from "@/app/admin/_components/date-range-picker-skeleton";
import { TableSkeleton } from "@/app/admin/_components/table-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ARCHIVE_KINDS } from "@mahjong-scoring/core";

import { PRACTICE_PROBLEM_SOURCES } from "@/lib/practice-problems/source";

/**
 * 問題の保存状況のローディング状態
 * ローディング
 *
 * 実体（タイトル → 説明 → 収集の状態 1 行 → 期間ピッカー → KPI 3 枚 → 日次推移の
 * チャート → 由来の表 → 内訳の表）の構造・余白に合わせて CLS を防ぐ。由来の表の
 * 行数は種別 × 由来の組の数、内訳の表の行数は種別の数（定数に無い値の行は DB を
 * 読むまで分からないので数えない）。
 */
export default function AdminPracticeProblemStatsLoading() {
  return (
    <>
      <AdminPageTitlePlaceholder width="w-48" className="mb-2" />
      <div className="mb-4 space-y-1">
        <SkeletonBar className="h-5 w-full max-w-2xl" tone={100} />
        <SkeletonBar className="h-5 w-full max-w-2xl" tone={100} />
        <SkeletonBar className="h-5 w-2/3 max-w-md" tone={100} />
      </div>
      {/* 収集の状態 */}
      <SkeletonBar className="mb-6 h-5 w-40" tone={100} />

      <div className="space-y-6">
        <section className="admin-panel space-y-4 p-6">
          <SkeletonBar className="h-7 w-48" />
          <SkeletonBar className="h-5 w-full" />
          <SkeletonBar className="h-32 w-full" />
        </section>
        <DateRangePickerSkeleton />

        {/* KPI 3 枚 */}
        <div className="grid gap-6 sm:grid-cols-3">
          {Array.from({ length: 1 + ARCHIVE_KINDS.length }, (_, i) => (
            <section key={i} className="admin-kpi space-y-2">
              <SkeletonBar className="h-5 w-40" tone={100} />
              <SkeletonBar className="h-14 w-20" />
              <SkeletonBar className="h-4 w-24" tone={100} />
              <SkeletonBar className="h-4 w-48" tone={100} />
            </section>
          ))}
        </div>

        {/* 日次推移チャート */}
        <section className="admin-panel p-6">
          <SkeletonBar className="mb-4 h-7 w-48" />
          <SkeletonBar className="h-[300px] w-full" tone={100} />
        </section>

        {/* 由来ごとの保存数 */}
        <section>
          <SkeletonBar className="mb-4 h-7 w-40" />
          <TableSkeleton
            columns={5}
            rows={ARCHIVE_KINDS.length * PRACTICE_PROBLEM_SOURCES.length}
          />
        </section>

        {/* 盤面の内訳 */}
        <section>
          <SkeletonBar className="mb-4 h-7 w-40" />
          <SkeletonBar className="mb-4 h-5 w-2/3 max-w-xl" tone={100} />
          <TableSkeleton columns={6} rows={ARCHIVE_KINDS.length} />
        </section>
      </div>
    </>
  );
}
