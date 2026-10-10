import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 通報の詳細のローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonBar className="h-5 w-24" tone={100} />
      <AdminPageTitlePlaceholder width="w-48" />
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBar key={i} className="h-48 w-full" radius="lg" tone={100} />
        ))}
      </div>
    </div>
  );
}
