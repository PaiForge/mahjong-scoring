import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";

import { LeaderboardRowListSkeleton } from "../_components/leaderboard-row-list-skeleton";

/**
 * ランキング一覧の読み込み中スケルトン
 *
 * 案内と期間切り替え、分野見出し、種目パネルを実描画と同じ順序で置く。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-40" />

      <LeaderboardRowListSkeleton />
    </ContentContainer>
  );
}
