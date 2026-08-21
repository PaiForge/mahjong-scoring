import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/**
 * お知らせ管理（一覧・作成・編集）のローディング状態。
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
        <AdminPageTitle>
          <PageTitleSkeleton width="w-40" />
        </AdminPageTitle>
        <SkeletonBar className="h-9 w-24 rounded" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 2 }, (_, i) => (
          <section key={i} className="rounded-lg border border-surface-200">
            <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
              <SkeletonBar className="h-4 w-32 rounded" />
              <SkeletonBar className="h-4 w-16 rounded" tone={100} />
            </div>
            <div className="space-y-3 p-4">
              {Array.from({ length: 2 }, (_row, j) => (
                <SkeletonBar
                  key={j}
                  className="h-5 w-full rounded"
                  tone={100}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
