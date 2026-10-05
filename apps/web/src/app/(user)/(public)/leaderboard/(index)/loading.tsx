import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";

import { LeaderboardRowListSkeleton } from "../_components/leaderboard-row-list-skeleton";

/**
 * ランキング一覧の読み込み中スケルトン
 *
 * 汎用の `PageSkeleton` は見出しの下に本文の行を 3 本置く姿で、地の文を
 * 持たないこのページとはずれる。実描画と同じ「分野の見出し pill → その分野の
 * 土俵の行リスト」で組む。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-40" />

      <LeaderboardRowListSkeleton />
    </ContentContainer>
  );
}
