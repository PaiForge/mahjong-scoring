import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";
import { ScoreTableSkeleton } from "./_components/score-table-skeleton";

/**
 * 点数早見表の読み込み中スケルトン
 *
 * 汎用の `PageSkeleton`（見出し pill + 本文 3 行 + カード 4 枚）は読み物の形で、
 * このページの実体は切り替えトグルと表だけ。見出し pill は実物に存在せず、
 * 遷移中だけ現れて消えていた。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitle>
        <PageTitleSkeleton width="w-28" />
      </PageTitle>

      <ScoreTableSkeleton />
    </ContentContainer>
  );
}
