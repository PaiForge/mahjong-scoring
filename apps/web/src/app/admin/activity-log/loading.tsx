import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";
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
      <AdminPageTitle>
        <PageTitleSkeleton width="w-48" />
      </AdminPageTitle>
      <LogFilterSkeleton />
      <TableSkeleton columns={5} />
    </div>
  );
}
