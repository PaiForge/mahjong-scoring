import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

/**
 * 公開ルート共通のローディング状態（キャッチオール）。
 *
 * 個別の loading.tsx を持たないルートのナビゲーション時に、サーバー描画完了まで
 * 即座にこのスケルトンを表示する。これにより「クリック後に画面が固まって見える」
 * 体感を解消する。より忠実なスケルトンが必要なルートは個別に loading.tsx を置く。
 * ローディング
 */
export default function PublicLoading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現し CLS を防ぐ */}
      <PageTitle>
        <span className="inline-block h-7 w-48 animate-pulse rounded bg-surface-300 align-middle" />
      </PageTitle>

      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-surface-200" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-100" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-surface-100" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-100" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-md bg-surface-100" />
          ))}
        </div>
      </div>
    </ContentContainer>
  );
}
