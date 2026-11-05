import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { TableSkeleton } from "@/app/admin/_components/table-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

import { ANNOUNCEMENT_TABLE_COLUMNS } from "../_lib/table-columns";

/**
 * お知らせ管理一覧のローディング状態。
 *
 * admin/loading.tsx（ダッシュボード忠実スケルトン）を継承せず、お知らせ一覧の
 * 構造（見出し + 新規作成ボタン → スラッグ単位のテーブルセクション）に合わせた
 * スケルトンを表示する。
 * ローディング
 *
 * route group `(list)` は、この index の loading.tsx が兄弟ルート（`[id]/edit` / `new`）の
 * 祖先にならないようにするためだけにある。不変条件（動的ルートは loading.tsx を 1 枚・
 * 静的ルートは 0 枚）と理由は `apps/web/src/app/loading-boundaries.test.ts`。page.tsx と
 * loading.tsx を 1 つ上に移すとそのテストが落ちる。
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
            <TableSkeleton
              columns={ANNOUNCEMENT_TABLE_COLUMNS.length}
              rows={2}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
