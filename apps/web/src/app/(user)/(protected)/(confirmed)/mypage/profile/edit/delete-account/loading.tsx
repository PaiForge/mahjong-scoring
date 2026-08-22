import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/**
 * 退会ページのローディング状態。
 * 実描画（注意文 → 影響の箇条書き 3 行 → 削除ボタン → 戻るリンク）に合わせる。
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-24" />
      </PageTitle>

      <div className="mt-6 space-y-6">
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

        {/* 削除ボタン */}
        <SkeletonBar radius="lg" className="h-11 w-full sm:w-48" />

        {/* 戻るリンク */}
        <SkeletonBar className="h-3.5 w-40" />
      </div>
    </ContentContainer>
  );
}
