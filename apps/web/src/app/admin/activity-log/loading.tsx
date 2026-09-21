import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import {
  LogFilterSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/table-skeleton";

/**
 * アクティビティログのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminPageTitlePlaceholder width="w-48" />
      <LogFilterSkeleton />
      <TableSkeleton columns={5} />
    </div>
  );
}
