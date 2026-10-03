import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";

/**
 * ユーザー詳細のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonBar className="h-4 w-28" />
      <AdminPageTitlePlaceholder width="w-48" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonBar key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}
