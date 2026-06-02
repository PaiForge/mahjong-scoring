import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

import { DashboardSkeleton } from "./_components/dashboard-skeleton";

/**
 * チャレンジダッシュボードのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <span className="inline-block h-7 w-40 animate-pulse rounded bg-surface-300 align-middle" />
      </PageTitle>
      <DashboardSkeleton />
    </ContentContainer>
  );
}
