import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * アカウントページのローディング状態
 * ローディング
 *
 * 実描画（ログイン情報のカード 1 枚 → 退会リンク）に合わせる。
 * カードの太枠は `/mypage/plan` のスケルトンと同じく灰色に置き換える。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-32" />

      <section className="space-y-4">
        <SectionTitleSkeleton width="w-28" />
        <div className="space-y-4 rounded-panel border border-surface-100 bg-surface-50 p-5">
          {/* 項目 2 つ（実: dt text-xs = 16px 行、dd text-sm = 20px 行 + mt-0.5） */}
          {[0, 1].map((i) => (
            <div key={i}>
              <div className="flex h-4 items-center">
                <SkeletonBar className="h-3 w-24" />
              </div>
              <div className="mt-0.5 flex h-5 items-center">
                <SkeletonBar className="h-3.5 w-56" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 退会リンク（実: mt-10 border-t pt-6 中央寄せ） */}
      <div className="mt-10 flex justify-center border-t border-panel pt-6">
        <SkeletonBar className="h-4 w-32" />
      </div>
    </ContentContainer>
  );
}
