import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

/**
 * 公開プロフィールのローディング状態。
 *
 * 実ページ（page.tsx）の構造に合わせ、中央寄せのアバター・表示名・@ユーザー名と
 * 自己紹介セクションをプレースホルダで再現する。汎用の PageSkeleton では
 * アバターやセクション構成が一致せず実体とズレるため、専用に用意している。
 * SNS セクションは表示が任意（リンク未設定なら描画されない）のため、
 * 余計な CLS を生まないようスケルトンには含めない。
 * ローディング
 */
export default function PublicProfileLoading() {
  return (
    <ContentContainer>
      {/* PageTitle を直接の子にしてタイトル帯へ引き上げる（実ページと同じ構造） */}
      <PageTitle>
        <span className="inline-block h-7 w-32 animate-pulse rounded bg-surface-300 align-middle" />
      </PageTitle>

      <div className="space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-20 w-20 animate-pulse rounded-full bg-surface-200" />
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-32 animate-pulse rounded bg-surface-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface-100" />
          </div>
        </div>

        <section className="space-y-4">
          {/* SectionTitle の緑アクセントバーを再現して CLS を防ぐ */}
          <div className="border-b-2 border-primary-500 pb-2">
            <span className="inline-block h-6 w-24 animate-pulse rounded bg-surface-200 align-middle" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-surface-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-surface-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-surface-100" />
          </div>
        </section>
      </div>
    </ContentContainer>
  );
}
