import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

import { DashboardSkeleton } from "./_components/dashboard-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * チャレンジダッシュボードのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <SkeletonBar
          className="inline-block h-7 w-40 rounded align-middle"
          tone={300}
          as="span"
        />
      </PageTitle>
      <DashboardSkeleton />
    </ContentContainer>
  );
}
