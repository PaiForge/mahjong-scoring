import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import {
  PageTitleSkeleton,
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
      <AdminPageTitle>
        <PageTitleSkeleton width="w-40" />
      </AdminPageTitle>
      <LogFilterSkeleton />
      <TableSkeleton columns={6} />
    </div>
  );
}
