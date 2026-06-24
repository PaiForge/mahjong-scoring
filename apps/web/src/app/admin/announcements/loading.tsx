import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";

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
          <span className="inline-block h-7 w-40 animate-pulse rounded bg-surface-200 align-middle" />
        </AdminPageTitle>
        <div className="h-9 w-24 animate-pulse rounded bg-surface-200" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 2 }, (_, i) => (
          <section key={i} className="rounded-lg border border-surface-200">
            <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
              <div className="h-4 w-32 animate-pulse rounded bg-surface-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-surface-100" />
            </div>
            <div className="space-y-3 p-4">
              {Array.from({ length: 2 }, (_row, j) => (
                <div
                  key={j}
                  className="h-5 w-full animate-pulse rounded bg-surface-100"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
