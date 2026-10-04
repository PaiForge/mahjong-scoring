import { CurriculumProgressBarSkeleton } from "@/app/(user)/(public)/learn/_components/curriculum-progress-bar-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/**
 * ダッシュボードの読み込み中スケルトン。
 *
 * 実体（HomeDashboard）の「次にやること」（見出しピル + 帯色のカード）と
 * 「教本の続き」（見出しピル + 進捗バー + 章カード + 右寄せリンク）を同じ順・
 * 同じ高さで模す。
 *
 * 「次にやること」のカードは、帯バッジと目標の 2 行（48px）・一歩の一文（1〜2 行）・
 * 進み具合の 1 行（16px）・ボタン（50px）・下のリンク（20px）に、`space-y-4` の
 * 間隔と `p-5` の余白を足した高さ。一文の行数で丈が変わるため、モバイルでは
 * 2 行、md 以上では 1 行に合わせる。帯色の枠は写さずグレーの矩形にする
 * （読み込み中の画面が実物より賑やかに見えるため）。
 *
 * それ以降のセクション（総合演習・お知らせ）は描かない。上のセクションの
 * 高さが実体と一致していれば、下に追記される分は可視要素を動かさない。
 * 全級取得済みで「次にやること」が出ないユーザーでは実体が短くなり、フッターが
 * 繰り上がる分のシフトが出るが、それは行程の終点に着いた人だけの状態。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-24" />

      <div className="space-y-8">
        {/* 次の一歩: 帯色のカード 1 枚 */}
        <div className="space-y-4">
          <SectionTitleSkeleton width="w-28" />
          <SkeletonBar
            radius="xl"
            className="h-[286px] w-full md:h-[266px]"
            tone={100}
          />
        </div>

        {/* 教本の続き: 進捗バー(40px) + 章カード(93px) + リンク行(24px) */}
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
        </div>
      </div>
    </ContentContainer>
  );
}
