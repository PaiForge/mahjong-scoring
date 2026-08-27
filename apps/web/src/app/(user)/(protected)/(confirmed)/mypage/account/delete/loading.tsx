import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/**
 * 退会ページのローディング状態。
 * 実描画（確認セクション → 注意文 → 影響の箇条書き 3 行 → 削除ボタン → 戻るリンク）に合わせる。
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-24" />
      </PageTitle>

      <section className="space-y-4">
        <SectionTitleSkeleton width="w-16" />

        <div className="space-y-3">
          {/* 注意文（text-sm leading-relaxed = 1 行 26.6px、実描画は 2 行） */}
          <div className="space-y-1">
            <SkeletonBar className="h-3.5 w-full" />
            <SkeletonBar className="h-3.5 w-3/4" />
          </div>
          {/* 影響の箇条書き 3 行 */}
          <div className="space-y-1.5 pl-5">
            <SkeletonBar className="h-3.5 w-5/6" />
            <SkeletonBar className="h-3.5 w-4/6" />
            <SkeletonBar className="h-3.5 w-5/6" />
          </div>
        </div>
      </section>

      {/* 削除ボタン（実: size lg / fullWidth） */}
      <div className="mt-8">
        <SkeletonBar radius="lg" className="h-11 w-full" />
      </div>

      {/* 戻るリンク（実: mt-10 border-t pt-6 中央寄せ） */}
      <div className="mt-10 flex justify-center border-t-2 border-dashed border-border/40 pt-6">
        <SkeletonBar className="h-4 w-40" />
      </div>
    </ContentContainer>
  );
}
