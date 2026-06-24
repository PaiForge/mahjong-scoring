import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";

/**
 * admin シェル配下の汎用ローディング状態。
 *
 * 独自の loading.tsx を持たない管理ページ（ダッシュボード / お知らせ一覧・作成・
 * 編集）への遷移で、admin レイアウト描画後の子セグメント待機を覆う。特定ページの
 * レイアウトに依存しない汎用スケルトンとし、画面構成の変更にも追従させる。忠実な
 * スケルトンが必要なページは各ルートに専用の loading.tsx を置く（そちらが優先）。
 * ローディング
 */
export default function AdminLoading() {
  return (
    <div>
      <AdminPageTitle className="mb-6">
        <div className="h-8 w-40 bg-surface-200 rounded animate-pulse" />
      </AdminPageTitle>
      <div className="mb-8 h-4 w-2/3 max-w-md bg-surface-100 rounded animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-20 w-full bg-surface-100 rounded-lg border border-surface-200 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
