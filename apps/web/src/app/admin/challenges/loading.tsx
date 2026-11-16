import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { DateRangePickerSkeleton } from "@/app/admin/_components/date-range-picker-skeleton";
import { TableSkeleton } from "@/app/admin/_components/table-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import {
  isExamMenuType,
  PRACTICE_MENU_TYPES,
} from "@mahjong-scoring/features/practice-menu-types";

/** 表の行数（レジストリの練習のうち、昇級試験を除いたもの） */
const LISTED_PRACTICE_COUNT = PRACTICE_MENU_TYPES.filter(
  (menuType) => !isExamMenuType(menuType),
).length;

/**
 * チャレンジの実施状況のローディング状態
 * ローディング
 *
 * 実体（タイトル → 説明 → 期間ピッカー → KPI 2 枚 → 並び順のタブ → 表）の
 * 構造・余白に合わせて CLS を防ぐ。表の行数はレジストリの練習数（昇級試験を除く。
 * レジストリに無い menu_type の行は DB を読むまで分からないので数えない）。
 */
export default function AdminChallengeStatsLoading() {
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
          <SkeletonBar className="my-2 h-5 w-24" tone={100} />
          <SkeletonBar className="my-2 h-5 w-24" tone={100} />
          <SkeletonBar className="my-2 h-5 w-24" tone={100} />
        </div>

        <TableSkeleton columns={5} rows={LISTED_PRACTICE_COUNT} />
      </div>
    </>
  );
}
