import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/**
 * ダッシュボード（admin/page.tsx）のローディング状態。
 *
 * admin レイアウトはシェル（サイドバー）を即時描画し、ページ側で
 * `requireAdminPage()`（認証）と新規ユーザー集計を待つ。その待機をこの 1 枚で
 * 覆う。実体（タイトル → 説明 → 期間ピッカー → サマリーカード → 日次推移
 * チャート）の構造・余白に合わせて CLS を防ぐ。
 *
 * ダッシュボード（page.tsx）と一緒に route group `(dashboard)` に置き、他の管理
 * ページの祖先にならないようにしている。admin/loading.tsx に置くと users 等の
 * loading.tsx と入れ子になり、プリフェッチがこちらしか取らないため個別スケルトンが
 * 機能しなくなる（`loading-boundaries.test.ts` が検査する）。
 * ローディング
 */
export default function AdminDashboardLoading() {
  return (
    <>
      <AdminPageTitle className="mb-2">
        <PageTitleSkeleton width="w-40" />
      </AdminPageTitle>
      <SkeletonBar className="mb-6 h-4 w-2/3 max-w-md" tone={100} />

      <div className="space-y-6">
        {/* 期間ピッカー（ラベル + 日付入力 ×2、プリセットボタン ×3） */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <SkeletonBar className="h-4 w-12" tone={100} />
            <SkeletonBar className="h-9 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBar className="h-4 w-12" tone={100} />
            <SkeletonBar className="h-9 w-40" />
          </div>
          <div className="flex gap-1.5">
            <SkeletonBar className="h-8 w-16" tone={100} />
            <SkeletonBar className="h-8 w-16" tone={100} />
            <SkeletonBar className="h-8 w-16" tone={100} />
          </div>
        </div>

        {/* サマリーカード */}
        <section className="space-y-1 rounded-lg border border-surface-200 bg-surface-50 p-6">
          <SkeletonBar className="h-4 w-40" tone={100} />
          <SkeletonBar className="h-9 w-20" />
          <SkeletonBar className="h-3 w-56" tone={100} />
        </section>

        {/* 日次推移チャート */}
        <section className="rounded-lg border border-surface-200 bg-surface-50 p-6">
          <SkeletonBar className="mb-4 h-7 w-48" />
          <SkeletonBar className="h-[300px] w-full" tone={100} />
        </section>
      </div>
    </>
  );
}
