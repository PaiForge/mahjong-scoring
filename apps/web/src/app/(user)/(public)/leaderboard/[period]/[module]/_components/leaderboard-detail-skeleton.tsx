import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/**
 * リーダーボード詳細のスケルトン
 * リーダーボード詳細スケルトン
 *
 */
export function LeaderboardDetailSkeleton() {
  return (
    <ContentContainer className="space-y-6">
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-48" />
      </PageTitle>

      {/* モジュール名 */}
      <SectionTitleSkeleton width="w-32" />

      <div className="space-y-4">
        {/* 期間ラベル + 期間セレクタ（実UIは gap-4） */}
        <div className="flex items-center justify-between gap-4">
          <SkeletonBar className="h-5 w-16" tone={100} />
          <SkeletonBar className="h-9 w-32" tone={100} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBar key={i} className="h-12 w-full" tone={100} />
        ))}
      </div>

      {/* 「チャレンジに挑戦」ボタン（実UIで常時表示） */}
      <div className="border-t-2 border-dashed border-border/40 pt-4">
        <SkeletonBar radius="lg" className="h-11 w-full" tone={100} />
      </div>
    </ContentContainer>
  );
}
