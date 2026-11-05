import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";

import { LeaderboardRowListSkeleton } from "../_components/leaderboard-row-list-skeleton";

/**
 * ランキング一覧の読み込み中スケルトン
 *
 * 案内と期間切り替え、分野見出し、種目パネルを実描画と同じ順序で置く。
 *
 * route group `(index)` は、この index の loading.tsx が兄弟ルート（`[period]/[module]`）の
 * 祖先にならないようにするためだけにある。不変条件（動的ルートは loading.tsx を 1 枚・
 * 静的ルートは 0 枚）と理由は `apps/web/src/app/loading-boundaries.test.ts`。page.tsx と
 * loading.tsx を 1 つ上に移すとそのテストが落ちる。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-40" />

      <LeaderboardRowListSkeleton />
    </ContentContainer>
  );
}
