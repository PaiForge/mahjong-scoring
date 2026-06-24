import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";

/**
 * ダッシュボード（admin/page.tsx）のローディング状態。
 *
 * admin レイアウトはシェル（サイドバー）を即時描画し、ページ側で
 * `requireAdminPage()`（認証）と新規ユーザー集計を待つ。その待機をこの 1 枚で
 * 覆う。実体（タイトル → 説明 → 期間ピッカー → サマリーカード → 日次推移
 * チャート）の構造・余白に合わせて CLS を防ぐ。お知らせ等の他ページは各ルートの
 * loading.tsx が優先される。
 * ローディング
 */
export default function AdminDashboardLoading() {
  return (
    <>
      <AdminPageTitle className="mb-2">
        <span className="inline-block h-7 w-40 animate-pulse rounded bg-surface-200 align-middle" />
      </AdminPageTitle>
      <div className="mb-6 h-4 w-2/3 max-w-md animate-pulse rounded bg-surface-100" />

      <div className="space-y-6">
        {/* 期間ピッカー（ラベル + 日付入力 ×2、プリセットボタン ×3） */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 animate-pulse rounded bg-surface-100" />
            <div className="h-9 w-40 animate-pulse rounded bg-surface-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 animate-pulse rounded bg-surface-100" />
            <div className="h-9 w-40 animate-pulse rounded bg-surface-200" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-8 w-16 animate-pulse rounded bg-surface-100" />
            <div className="h-8 w-16 animate-pulse rounded bg-surface-100" />
            <div className="h-8 w-16 animate-pulse rounded bg-surface-100" />
          </div>
        </div>

        {/* サマリーカード */}
        <section className="space-y-1 rounded-lg border border-surface-200 bg-surface-50 p-6">
          <div className="h-4 w-40 animate-pulse rounded bg-surface-100" />
          <div className="h-9 w-20 animate-pulse rounded bg-surface-200" />
          <div className="h-3 w-56 animate-pulse rounded bg-surface-100" />
        </section>

        {/* 日次推移チャート */}
        <section className="rounded-lg border border-surface-200 bg-surface-50 p-6">
          <div className="mb-4 h-7 w-48 animate-pulse rounded bg-surface-200" />
          <div className="h-[300px] w-full animate-pulse rounded bg-surface-100" />
        </section>
      </div>
    </>
  );
}
