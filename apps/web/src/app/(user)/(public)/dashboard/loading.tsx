import { CurriculumProgressBarSkeleton } from "@/app/(user)/(public)/learn/_components/curriculum-progress-bar-skeleton";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/**
 * ダッシュボードの読み込み中スケルトン。
 *
 * 実体（HomeDashboard）の「教本の続き」（見出しピル + 進捗バー + 章カード +
 * 右寄せリンク + 行リンク）と「おすすめの練習」（見出しピル + 練習カード 2 枚 +
 * 右寄せリンク）を実測の高さで模す。「お知らせ」以降は初期ビューポート
 * （420x900 実測）のフォールド下なので描かない — 上 2 セクションの高さが
 * 実体と一致していれば、下に追記される分は可視要素を動かさず CLS に効かない
 * （中級進捗のシードユーザー bob / carol で CLS 0.000 を実測）。
 *
 * 実体の形はユーザーの進捗で変わるため全状態との一致は原理的に不可能で、
 * ここでは中級進捗（セクション 2 つ + 試験行）に合わせている。進捗ゼロの
 * ユーザーでは実体が短くなり、フッターが繰り上がる分のシフトが出る
 * （alice で CLS 0.083 を実測。Google の「良好」閾値 0.1 未満で、
 * 読了 0 は最初の章を読むまでの一時的な状態）。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitle>
        <PageTitleSkeleton width="w-24" />
      </PageTitle>

      <div className="space-y-8">
        {/* 教本の続き: 進捗バー(40px) + 章カード(93px) + リンク行(24px) + 試験行(62px) */}
        <div className="space-y-4">
          <SectionTitleSkeleton width="w-32" />
          {/* 実体は /learn と同じ CurriculumProgressBar なので、スケルトンも
              同じものを使う。矩形 1 枚で代用すると高さは合っていても
              「ラベル行 + 細いトラック」というバーの形が出ない */}
          <CurriculumProgressBarSkeleton />
          <SkeletonBar radius="xl" className="h-[93px] w-full" tone={100} />
          <div className="flex justify-end">
            <SkeletonBar className="h-5 w-28" tone={100} />
          </div>
          <SkeletonBar radius="xl" className="h-[62px] w-full" tone={100} />
        </div>

        {/* おすすめの練習: 練習カード(144px) x 2 + リンク行(24px) */}
        <div className="space-y-4">
          <SectionTitleSkeleton width="w-36" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SkeletonBar radius="xl" className="h-36 w-full" tone={100} />
            <SkeletonBar radius="xl" className="h-36 w-full" tone={100} />
          </div>
          <div className="flex justify-end">
            <SkeletonBar className="h-5 w-28" tone={100} />
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
