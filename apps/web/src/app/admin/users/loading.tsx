import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import {
  PageTitleSkeleton,
  TableSkeleton,
} from "@/app/admin/_components/table-skeleton";

/**
 * ユーザー管理のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <AdminPageTitle>
        <PageTitleSkeleton width="w-32" />
      </AdminPageTitle>
      <TableSkeleton columns={6} />
    </div>
  );
}
