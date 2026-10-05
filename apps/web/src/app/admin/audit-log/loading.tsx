import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import {
  LogFilterSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/table-skeleton";

/**
 * 監査ログのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminPageTitlePlaceholder width="w-40" />
      <LogFilterSkeleton />
      <TableSkeleton columns={6} />
    </div>
  );
}
