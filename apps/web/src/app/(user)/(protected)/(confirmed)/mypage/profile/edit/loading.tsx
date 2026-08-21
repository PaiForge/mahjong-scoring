import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

/** SNS 入力欄スケルトンのキー（index key を避けるための固定ID） */
const SNS_FIELDS = ["x", "instagram", "youtube"] as const;

/**
 * プロフィール編集ページのローディング状態。
 * 実描画（アバター → 基本情報 → SNS → 保存ボタン → 退会リンク）に合わせる。
 * ローディング
 */
export default function Loading() {
  return (
    <ContentContainer>
      {/* PageTitle を使うことで実描画と同じ全幅グレー帯を再現する */}
      <PageTitle>
        <PageTitleSkeleton width="w-44" />
      </PageTitle>

      <div className="space-y-8">
        {/* アバター（実: 中央寄せの円 + 画像選択リンク + ヒント） */}
        <div className="flex flex-col items-center gap-3">
          <SkeletonBar radius="full" className="h-20 w-20" />
          <SkeletonBar className="h-4 w-20" />
          <SkeletonBar className="h-3 w-56" />
        </div>

        {/* 基本情報セクション */}
        <section className="space-y-4">
          <SectionTitle>
            <SkeletonBar
              className="inline-block h-5 w-24 align-middle"
              as="span"
            />
          </SectionTitle>

          {/* 表示名（label + 説明 + input） */}
          <div className="space-y-2">
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-3 w-64" />
            <SkeletonBar radius="lg" className="h-9 w-full" />
          </div>

          {/* 自己紹介（label + textarea + カウンタ） */}
          <div className="space-y-2">
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar radius="lg" className="h-24 w-full" />
            <SkeletonBar className="ml-auto h-3 w-12" />
          </div>
        </section>

        {/* SNS セクション（X / Instagram / YouTube） */}
        <section className="space-y-4">
          <SectionTitle>
            <SkeletonBar
              className="inline-block h-5 w-28 align-middle"
              as="span"
            />
          </SectionTitle>

          {SNS_FIELDS.map((field) => (
            <div key={field} className="space-y-2">
              <SkeletonBar className="h-4 w-24" />
              <SkeletonBar radius="lg" className="h-9 w-full" />
            </div>
          ))}
        </section>

        {/* 保存ボタン */}
        <SkeletonBar radius="lg" className="h-11 w-full" />
      </div>

      {/* 退会リンク（実: mt-10 border-t pt-6 中央寄せ） */}
      <div className="mt-10 flex justify-center border-t-2 border-dashed border-border/40 pt-6">
        <SkeletonBar className="h-4 w-28" />
      </div>
    </ContentContainer>
  );
}
