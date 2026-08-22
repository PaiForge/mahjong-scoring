import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

import { DashboardSkeleton } from "./_components/dashboard-skeleton";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/**
 * チャレンジダッシュボードのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-40" />
      </PageTitle>
      <DashboardSkeleton />
    </ContentContainer>
  );
}
