import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { TableSkeleton } from "@/app/admin/_components/table-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * お知らせ管理一覧のローディング状態。
 *
 * admin/loading.tsx（ダッシュボード忠実スケルトン）を継承せず、お知らせ一覧の
 * 構造（見出し + 新規作成ボタン → スラッグ単位のテーブルセクション）に合わせた
 * スケルトンを表示する。
 * ローディング
 */
export default function AnnouncementsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminPageTitlePlaceholder width="w-40" />
        <SkeletonBar className="h-9 w-24" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 2 }, (_, i) => (
          <section key={i} className="admin-panel">
            <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
              <SkeletonBar className="h-5 w-32" />
              <SkeletonBar className="h-5 w-16" tone={100} />
            </div>
            <TableSkeleton columns={5} rows={2} compact />
          </section>
        ))}
      </div>
    </div>
  );
}
