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
 *
 * 実描画のカードは苔緑の太枠（`border-ink`）だが、スケルトンは灰色の枠と面に
 * 置き換える（`ProblemListSkeleton` と同じ理由 — 読み込み中の画面が実物より
 * 賑やかに見えるため）。枠は border-box なので、色だけ替えても・アバターの枠を
 * 外しても高さは実描画と一致したまま。
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
        <section className="flex items-center gap-4 rounded-lg border-3 border-surface-100 bg-surface-50 p-4">
          <SkeletonBar radius="full" className="h-20 w-20 flex-shrink-0" />
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
        <section className="rounded-lg border-3 border-surface-100 bg-surface-50 p-4">
          <div className="mb-3 flex h-5 items-center">
            <SkeletonBar className="h-3.5 w-28" />
          </div>
          <HeatmapSkeleton />
        </section>

        {/* 行リンク（実: LinkRow。絵文字(text-lg) + タイトル(text-sm) +
            説明(text-xs) を py-3 の行に置き、破線で区切る） */}
        <ul className="flex flex-col">
          <li className="flex items-start gap-3 border-b border-dashed border-border/40 py-3 last:border-b-0">
            <SkeletonBar radius="md" className="size-6 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex h-5 items-center">
                <SkeletonBar className="h-3.5 w-28" />
              </div>
              <div className="mt-0.5 flex h-4 items-center">
                <SkeletonBar className="h-3 w-5/6" tone={100} />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </ContentContainer>
  );
}
