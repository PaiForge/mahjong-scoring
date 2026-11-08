import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/[locale]/(user)/_components/page-title";

import { DashboardSkeleton } from "../_components/dashboard-skeleton";

/**
 * チャレンジダッシュボードのローディング状態
 * ローディング
 *
 * route group `(dashboard)` は、この index の loading.tsx が兄弟ルート（`results`）の
 * 祖先にならないようにするためだけにある。不変条件（動的ルートは loading.tsx を 1 枚・
 * 静的ルートは 0 枚）と理由は `apps/web/src/app/loading-boundaries.test.ts`。page.tsx と
 * loading.tsx を 1 つ上に移すとそのテストが落ちる。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-40" />
      <DashboardSkeleton />
    </ContentContainer>
  );
}
