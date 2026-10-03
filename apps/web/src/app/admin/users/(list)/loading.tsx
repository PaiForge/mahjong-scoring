import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import {
  LogFilterSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/table-skeleton";

/**
 * ユーザー管理のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminPageTitlePlaceholder width="w-32" />
      <LogFilterSkeleton fields={1} />
      <TableSkeleton columns={6} />
    </div>
  );
}
