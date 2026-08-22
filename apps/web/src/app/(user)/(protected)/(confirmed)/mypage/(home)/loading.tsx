import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

import { HeatmapSkeleton } from "./_components/heatmap-skeleton";

/**
 * マイページのローディング状態
 * ローディング
 *
 * 実描画（`page.tsx`）と同じ枠・同じ行の高さで組み、データ到着時に
 * レイアウトが動かないようにする。文字の矩形は行ボックス（text-lg なら 28px 等）
 * を持つラッパーに入れ、矩形自体はフォントサイズ相当にとどめる。
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-40" />
      </PageTitle>

      <div className="space-y-6">
        {/* プロフィールカード（実: flex items-center gap-4 border-3 bg-card p-4。
            アバター(lg=80px) + 表示名(text-lg) + @username(text-sm)
            + 公開プロフィール/編集リンク。リンクはモバイル幅で 2 行に折り返す） */}
        <section className="flex items-center gap-4 rounded-lg border-3 border-ink bg-card p-4">
          <SkeletonBar
            radius="full"
            className="h-20 w-20 flex-shrink-0 border-3 border-ink"
          />
          <div className="min-w-0">
            {/* 表示名: text-lg = 28px 行 */}
            <div className="flex h-7 items-center">
              <SkeletonBar className="h-5 w-40" />
            </div>
            {/* @username: text-sm = 20px 行 */}
            <div className="flex h-5 items-center">
              <SkeletonBar className="h-3.5 w-24" />
            </div>
            {/* リンク 2 つ（実: px-3 py-1.5 text-sm = 高さ 32px、gap-1 で flex-wrap）。
                幅は実文言（公開プロフィール / プロフィール編集）に合わせてあり、
                実描画と同じ幅でモバイルでは 2 行に折り返す。 */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <SkeletonBar radius="lg" className="h-8 w-40" />
              <SkeletonBar radius="lg" className="h-8 w-40" />
            </div>
          </div>
        </section>

        {/* アクティビティヒートマップ（実: border-3 bg-card p-4、見出しは text-sm + mb-3） */}
        <section className="rounded-lg border-3 border-ink bg-card p-4">
          <div className="mb-3 flex h-5 items-center">
            <SkeletonBar className="h-3.5 w-28" />
          </div>
          <HeatmapSkeleton />
        </section>

        {/* カード（実: rounded-xl border-3 bg-card p-6。
            アイコン(text-2xl) + 見出し(text-base) + 説明(text-sm)） */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border-3 border-ink bg-card p-6 shadow-sm">
            <div className="flex h-8 items-center">
              <SkeletonBar className="h-7 w-7" />
            </div>
            <div className="mt-2 flex h-6 items-center">
              <SkeletonBar className="h-4 w-28" />
            </div>
            <div className="mt-1 flex h-5 items-center">
              <SkeletonBar className="h-3.5 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
