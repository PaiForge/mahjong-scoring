import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { TableSkeleton } from "@/app/admin/_components/table-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 特典の手動付与一覧のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <AdminPageTitlePlaceholder width="w-40" />
        <SkeletonBar className="h-5 w-96 max-w-full" tone={100} />
      </div>
      <TableSkeleton columns={7} />
    </div>
  );
}
