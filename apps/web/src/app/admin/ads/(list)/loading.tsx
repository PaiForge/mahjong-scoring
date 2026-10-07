import { AdminPageTitlePlaceholder } from "@/app/admin/_components/admin-page-title";
import { AD_SLOT_VALUES, platformForSlot } from "@/lib/ads/registry";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * ネイティブ広告管理一覧のローディング状態
 * ローディング
 *
 * 一覧の構造（見出し + 説明 → タブ → トラッキング ID → スロット単位の
 * セクション）に合わせる。タブはクエリを読めないので、既定の web のタブの
 * スロット数で並べる。
 */
const WEB_SLOTS = AD_SLOT_VALUES.filter(
  (slot) => platformForSlot(slot) === "web",
);

export default function AdsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <AdminPageTitlePlaceholder width="w-40" />
        <SkeletonBar className="h-5 w-96 max-w-full" tone={100} />
        <SkeletonBar className="h-5 w-44" tone={100} />
      </div>

      <div className="admin-tabs" aria-hidden="true">
        <SkeletonBar className="my-2 h-5 w-24" tone={100} />
        <SkeletonBar className="my-2 h-5 w-20" tone={100} />
      </div>

      <section className="admin-panel space-y-2 p-4">
        <SkeletonBar className="h-5 w-48" />
        <div className="flex flex-wrap gap-2">
          <SkeletonBar className="h-[38px] w-64 max-w-full" />
          <SkeletonBar className="h-[38px] w-16" />
        </div>
        <SkeletonBar className="h-4 w-96 max-w-full" tone={100} />
      </section>
      <div className="space-y-6">
        {WEB_SLOTS.map((slot) => (
          <section key={slot} className="admin-panel">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-200 px-4 py-3">
              <div className="space-y-1">
                <SkeletonBar className="h-5 w-48" />
                <SkeletonBar className="h-4 w-28" tone={100} />
                <SkeletonBar className="h-4 w-52 max-w-full" tone={100} />
                <SkeletonBar className="h-4 w-60 max-w-full" tone={100} />
              </div>
              <SkeletonBar className="h-8 w-20" tone={100} />
            </div>
            <div className="px-4 py-3">
              <SkeletonBar className="h-5 w-full" tone={100} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
