import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * ネイティブ広告管理（一覧・作成・編集）のローディング状態
 * ローディング
 *
 * 一覧の構造（見出し + 説明 → スロット単位のセクション）に合わせる。
 */
export default function AdsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <AdminPageTitlePlaceholder width="w-40" />
        <SkeletonBar className="h-4 w-96 max-w-full" tone={100} />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 3 }, (_, i) => (
          <section key={i} className="rounded-lg border border-surface-200">
            <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
              <SkeletonBar className="h-4 w-48" />
              <SkeletonBar className="h-8 w-20" tone={100} />
            </div>
            <div className="p-4">
              <SkeletonBar className="h-5 w-full" tone={100} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
