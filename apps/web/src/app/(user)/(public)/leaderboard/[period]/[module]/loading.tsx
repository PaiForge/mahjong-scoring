import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

export default function LeaderboardDetailLoading() {
  return (
    <ContentContainer className="space-y-6">
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <SkeletonBar
          className="inline-block h-7 w-48 rounded align-middle"
          tone={300}
          as="span"
        />
      </PageTitle>

      {/* SectionTitle（モジュール名） */}
      <SkeletonBar className="h-7 w-32 rounded" tone={100} />

      <div className="space-y-4">
        {/* 期間ラベル + 期間セレクタ（実UIは gap-4） */}
        <div className="flex items-center justify-between gap-4">
          <SkeletonBar className="h-5 w-16 rounded" tone={100} />
          <SkeletonBar className="h-9 w-32 rounded" tone={100} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBar key={i} className="h-12 w-full rounded" tone={100} />
        ))}
      </div>

      {/* 「チャレンジに挑戦」ボタン（実UIで常時表示） */}
      <div className="border-t border-surface-200 pt-4">
        <SkeletonBar className="h-11 w-full rounded-lg" tone={100} />
      </div>
    </ContentContainer>
  );
}
