import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

import { LeaderboardTableSkeleton } from "../../../_components/leaderboard-table-skeleton";

/**
 * ランキング詳細の読み込み中スケルトン
 * ランキング詳細スケルトン
 *
 * 実描画（`[period]/[module]/page.tsx`）と同じ順で「タイトル帯 → 土俵名の
 * 見出し → 期間の行 → 表 → チャレンジのボタン」を置く。表の中身はページ側の
 * Suspense フォールバックと同じ `LeaderboardTableSkeleton` を使う。
 *
 * 期間の行はここでは実物を出せない（loading.tsx はルートのパラメータを
 * 受け取れないため、総合 / 月間 のどちらが選ばれているか分からない）。
 * 高さだけを合わせた矩形で埋める。
 */
export function LeaderboardDetailSkeleton() {
  return (
    <ContentContainer className="space-y-6">
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-48" />
      </PageTitle>

      {/* 土俵名 */}
      <SectionTitleSkeleton width="w-32" />

      {/* 期間ラベル + 期間セレクタ。セレクタの 34px は実物の内訳
          （枠 3px × 2 + 内側の余白 2px × 2 + 選択肢 24px） */}
      <div className="flex items-center justify-between gap-4">
        <SkeletonBar className="h-5 w-12" tone={100} />
        <SkeletonBar radius="full" className="h-[34px] w-28" tone={100} />
      </div>

      <LeaderboardTableSkeleton />

      {/* 「この種目にチャレンジ」ボタン（実描画では常時表示）。46px は
          実物の内訳（枠 3px × 2 + py-2.5 の 10px × 2 + 文字の行ボックス 20px） */}
      <div className="border-t-2 border-dashed border-border/40 pt-4">
        <SkeletonBar radius="lg" className="h-[46px] w-full" tone={100} />
      </div>
    </ContentContainer>
  );
}
