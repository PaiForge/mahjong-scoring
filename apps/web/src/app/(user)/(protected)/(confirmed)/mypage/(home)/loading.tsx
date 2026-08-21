import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/**
 * マイページのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-40" />
      </PageTitle>

      <div className="space-y-6">
        {/* プロフィールカード（実: flex items-center gap-4 border-border bg-card p-4。
            アバター(lg) + 表示名 + @username + 公開プロフィール/編集リンク） */}
        <section className="flex items-center gap-4 rounded-lg border-3 border-ink bg-card p-4">
          <SkeletonBar radius="full" className="h-20 w-20 flex-shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBar className="h-6 w-32" />
            <SkeletonBar className="h-4 w-24" />
            <div className="mt-1.5 flex gap-2">
              <SkeletonBar radius="lg" className="h-7 w-28" />
              <SkeletonBar radius="lg" className="h-7 w-28" />
            </div>
          </div>
        </section>

        {/* アクティビティヒートマップ（実: border-border bg-card p-4、mt なし） */}
        <section className="rounded-lg border-3 border-ink bg-card p-4">
          <SkeletonBar className="mb-3 h-5 w-32" />
          <SkeletonBar className="h-[140px] w-full" />
        </section>

        {/* カード（実: rounded-md border-border bg-card p-6） */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-md border-3 border-ink bg-card p-6">
            <SkeletonBar className="h-8 w-8" />
            <SkeletonBar className="mt-2 h-5 w-32" />
            <SkeletonBar className="mt-1 h-4 w-full" />
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
