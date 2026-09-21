import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";

import { DashboardSkeleton } from "../_components/dashboard-skeleton";

/**
 * チャレンジダッシュボードのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-40" />
      <DashboardSkeleton />
    </ContentContainer>
  );
}
