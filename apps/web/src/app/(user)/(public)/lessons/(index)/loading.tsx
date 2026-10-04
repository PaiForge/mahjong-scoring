import { ContentContainer } from "@/app/(user)/_components/content-container";
import {
  LinkRowList,
  LinkRowSkeleton,
} from "@/app/(user)/_components/link-row";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { LESSON_REGISTRY } from "@mahjong-scoring/features/lessons/registry";
import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";

/**
 * レッスン一覧の読み込み中スケルトン。一覧は完了を読む動的ルートなので境界を持つ
 *
 * 実体と同じ構造 — 級の見出し pill・できるようになることの 1 行・レッスンの
 * 行 — を級ごとに描く。行数はレジストリから数えるため、レッスンを足しても
 * 追従する。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-28" />

      <div className="space-y-8">
        {RANK_REGISTRY.map((rank) => {
          const count = LESSON_REGISTRY.filter(
            (lesson) => lesson.rankSlug === rank.slug,
          ).length;
          if (count === 0) return undefined;
          return (
            <div key={rank.slug} className="space-y-4">
              <div className="space-y-3">
                <SectionTitleSkeleton width="w-12" />
                <p className="text-sm">
                  <SkeletonBar
                    as="span"
                    tone={100}
                    className="inline-block w-3/5"
                  >
                    &nbsp;
                  </SkeletonBar>
                </p>
              </div>
              <LinkRowList>
                {Array.from({ length: count }, (_, index) => (
                  <LinkRowSkeleton key={index} titleWidthClassName="w-40" />
                ))}
              </LinkRowList>
            </div>
          );
        })}
      </div>
    </ContentContainer>
  );
}
