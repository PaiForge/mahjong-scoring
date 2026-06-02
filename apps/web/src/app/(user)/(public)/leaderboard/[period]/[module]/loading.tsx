import { ContentContainer } from '@/app/_components/content-container';
import { PageTitle } from '@/app/_components/page-title';

export default function LeaderboardDetailLoading() {
  return (
    <ContentContainer className="space-y-6">
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <span className="inline-block h-7 w-48 animate-pulse rounded bg-surface-300 align-middle" />
      </PageTitle>

      {/* SectionTitle（モジュール名） */}
      <div className="h-7 w-32 animate-pulse rounded bg-surface-100" />

      <div className="space-y-4">
        {/* 期間ラベル + 期間セレクタ（実UIは gap-4） */}
        <div className="flex items-center justify-between gap-4">
          <div className="h-5 w-16 animate-pulse rounded bg-surface-100" />
          <div className="h-9 w-32 animate-pulse rounded bg-surface-100" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-surface-100" />
        ))}
      </div>

      {/* 「チャレンジに挑戦」ボタン（実UIで常時表示） */}
      <div className="border-t border-surface-200 pt-4">
        <div className="h-11 w-full animate-pulse rounded-lg bg-surface-100 sm:w-48" />
      </div>
    </ContentContainer>
  );
}
