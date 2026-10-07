import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/**
 * `/mypage/plan` の読み込み中
 *
 * 本文と同じ箱（状態カード 1 枚 + 購入履歴の表）を灰色で描き、差し替え時の
 * レイアウトシフトを防ぐ。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-28" />

      <div className="space-y-8">
        <section className="space-y-4">
          <SectionTitleSkeleton width="w-24" />
          <div className="space-y-3 rounded-panel border border-panel bg-surface-50 p-5">
            <SkeletonBar className="h-6 w-40" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar radius="lg" className="h-[50px] w-full" />
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitleSkeleton width="w-20" />
          <SkeletonBar className="h-4 w-32" />
        </section>
      </div>
    </ContentContainer>
  );
}
