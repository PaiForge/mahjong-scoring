import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";

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
        <span className="inline-block h-7 w-44 animate-pulse rounded bg-surface-300 align-middle" />
      </PageTitle>

      <div className="space-y-8">
        {/* アバター（実: 中央寄せの円 + 画像選択リンク + ヒント） */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-20 w-20 animate-pulse rounded-full bg-surface-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-200" />
          <div className="h-3 w-56 animate-pulse rounded bg-surface-200" />
        </div>

        {/* 基本情報セクション */}
        <section className="space-y-4">
          <SectionTitle>
            <span className="inline-block h-5 w-24 animate-pulse rounded bg-surface-200 align-middle" />
          </SectionTitle>

          {/* 表示名（label + 説明 + input） */}
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-surface-200" />
            <div className="h-3 w-64 animate-pulse rounded bg-surface-200" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-surface-200" />
          </div>

          {/* 自己紹介（label + textarea + カウンタ） */}
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-surface-200" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-surface-200" />
            <div className="ml-auto h-3 w-12 animate-pulse rounded bg-surface-200" />
          </div>
        </section>

        {/* SNS セクション（X / Instagram / YouTube） */}
        <section className="space-y-4">
          <SectionTitle>
            <span className="inline-block h-5 w-28 animate-pulse rounded bg-surface-200 align-middle" />
          </SectionTitle>

          {SNS_FIELDS.map((field) => (
            <div key={field} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-surface-200" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-surface-200" />
            </div>
          ))}
        </section>

        {/* 保存ボタン */}
        <div className="h-11 w-full animate-pulse rounded-lg bg-surface-200" />
      </div>

      {/* 退会リンク（実: mt-10 border-t pt-6 中央寄せ） */}
      <div className="mt-10 flex justify-center border-t border-surface-200 pt-6">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-200" />
      </div>
    </ContentContainer>
  );
}
