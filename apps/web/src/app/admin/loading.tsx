import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";

/**
 * admin シェル配下の汎用ローディング状態。
 *
 * 独自の loading.tsx を持たない管理ページ（ダッシュボード / お知らせ一覧・作成・
 * 編集）への遷移で、admin レイアウト描画後の子セグメント待機を覆う。ダッシュボード
 * の構成（期間ピッカー → サマリーカード → 日次推移チャート）を再現しつつ、特定
 * レイアウトに強く依存しない汎用スケルトンとする。忠実なスケルトンが必要なページ
 * は各ルートに専用の loading.tsx を置く（そちらが優先）。
 * ローディング
 */
export default function AdminLoading() {
  return (
    <div>
      <AdminPageTitle className="mb-2">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-200" />
      </AdminPageTitle>
      <div className="mb-6 h-4 w-2/3 max-w-md animate-pulse rounded bg-surface-100" />

      {/* 期間ピッカー */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="h-9 w-44 animate-pulse rounded bg-surface-200" />
        <div className="h-9 w-44 animate-pulse rounded bg-surface-200" />
        <div className="h-9 w-48 animate-pulse rounded bg-surface-100" />
      </div>

      {/* サマリーカード */}
      <div className="mb-6 rounded-lg border border-surface-200 bg-surface-50 p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-surface-100" />
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-surface-200" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-surface-100" />
      </div>

      {/* 日次推移チャート */}
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-surface-200" />
        <div className="h-[300px] w-full animate-pulse rounded bg-surface-100" />
      </div>
    </div>
  );
}
