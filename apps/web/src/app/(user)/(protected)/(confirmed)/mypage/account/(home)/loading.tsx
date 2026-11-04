import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * アカウントページのローディング状態
 * ローディング
 *
 * 実描画（メールアドレスのカード → ログイン方法のカード → 退会リンク）に
 * 合わせる。カードの枠は `/mypage/plan` のスケルトンと同じく灰色に置き換える。
 * ログイン方法の行数は人によるので、いちばん多い形（パスワード・連携 1 つ・
 * 追加ボタン）に合わせる。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-32" />

      <div className="space-y-8">
        <section className="space-y-4">
          <SectionTitleSkeleton width="w-32" />
          {/* 実: p-5、アドレス text-sm（20px 行）と sm ボタン（32px）の行 */}
          <div className="flex h-[74px] items-center justify-between rounded-panel border border-panel bg-surface-50 px-5">
            <SkeletonBar className="h-3.5 w-56" />
            <SkeletonBar className="h-8 w-20" radius="lg" />
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitleSkeleton width="w-28" />
          <div className="divide-y divide-surface-100 overflow-hidden rounded-panel border border-panel bg-surface-50">
            {/* 行（実: px-5 py-4。名前 text-sm = 20px、状態 text-xs = 16px + mt-0.5、ボタン 32px） */}
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <div className="flex h-5 items-center">
                    <SkeletonBar className="h-3.5 w-40" />
                  </div>
                  <div className="mt-0.5 flex h-4 items-center">
                    <SkeletonBar className="h-3 w-24" />
                  </div>
                </div>
                <SkeletonBar className="h-8 w-28" radius="lg" />
              </div>
            ))}
            <div className="flex h-16 items-center px-5">
              <SkeletonBar className="h-8 w-48" radius="lg" />
            </div>
          </div>
        </section>
      </div>

      {/* 退会リンク（実: mt-10 border-t pt-6 中央寄せ） */}
      <div className="mt-10 flex justify-center border-t border-panel pt-6">
        <SkeletonBar className="h-4 w-32" />
      </div>
    </ContentContainer>
  );
}
