import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";

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
        <PageTitleSkeleton width="w-32" />
      </PageTitle>

      <div className="space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <SkeletonBar
            radius="full"
            className="h-20 w-20 border-3 border-ink"
          />
          <div className="flex flex-col items-center gap-2">
            <SkeletonBar className="h-6 w-32" />
            <SkeletonBar className="h-4 w-24" tone={100} />
          </div>
        </div>

        <section className="space-y-4">
          <SectionTitleSkeleton width="w-24" />
          <div className="space-y-2">
            <SkeletonBar className="h-4 w-full" tone={100} />
            <SkeletonBar className="h-4 w-11/12" tone={100} />
            <SkeletonBar className="h-4 w-4/5" tone={100} />
          </div>
        </section>
      </div>
    </ContentContainer>
  );
}
