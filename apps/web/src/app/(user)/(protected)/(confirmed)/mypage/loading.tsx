import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

/**
 * マイページのローディング状態
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <span className="inline-block h-7 w-40 animate-pulse rounded bg-surface-300 align-middle" />
      </PageTitle>

      <div className="space-y-6">
        {/* アクティビティヒートマップ（実: border-border bg-card p-4、mt なし） */}
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 h-5 w-32 animate-pulse rounded bg-surface-200" />
          <div className="h-[140px] w-full animate-pulse rounded bg-surface-200" />
        </section>

        {/* カード（実: rounded-md border-border bg-card p-6） */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-6">
            <div className="h-8 w-8 animate-pulse rounded bg-surface-200" />
            <div className="mt-2 h-5 w-32 animate-pulse rounded bg-surface-200" />
            <div className="mt-1 h-4 w-full animate-pulse rounded bg-surface-200" />
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
