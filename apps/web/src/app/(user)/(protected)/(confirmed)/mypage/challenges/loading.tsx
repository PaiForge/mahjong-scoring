import { ContentContainer } from "@/app/_components/content-container";

import { DashboardSkeleton } from "./_components/dashboard-skeleton";

/**
 * チャレンジダッシュボードのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      <div className="h-8 w-40 mb-6 bg-surface-200 rounded animate-pulse" />
      <div className="mt-6">
        <DashboardSkeleton />
      </div>
    </ContentContainer>
  );
}
