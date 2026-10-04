import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/**
 * ダッシュボードの読み込み中スケルトン。
 *
 * 実体（HomeDashboard）の先頭のセクション「次にやること」（見出しピル +
 * 帯色のカード）を同じ高さで模す。行程が進行中のあいだ実体は「次にやること」
 * → お知らせの 2 つだけで、「教本の続き」は全級取得済みのユーザーにしか
 * 出ないため写さない（写すと大多数のユーザーで、実体に無い進捗バーと章カードが
 * カードの下に出る）。
 *
 * 「次にやること」のカードは、帯バッジと目標（1〜2 行）・進み具合のステップ
 * 表示・ボタン（50px）・下のリンク（20px）に、`space-y-4` の間隔と
 * `p-5` の余白を足した高さ（2026-10 に 390px / 1280px 幅で実測し 290px / 274px）。
 * 目標の行数で丈が変わるため、モバイルでは 2 行、md 以上では 1 行に合わせる。
 * 帯色の枠は写さずグレーの矩形にする
 * （読み込み中の画面が実物より賑やかに見えるため）。
 *
 * それ以降のセクション（お知らせ）は描かない。上のセクションの高さが実体と
 * 一致していれば、下に追記される分は可視要素を動かさない（お知らせは件数で
 * 丈も変わる）。全級取得済みのユーザーでは「次にやること」の代わりに
 * 「教本の続き」・総合演習が並び形が食い違うが、それは行程の終点に着いた人
 * だけの状態。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-24" />

      {/* 次にやること: 帯色のカード 1 枚 */}
      <div className="space-y-4">
        <SectionTitleSkeleton width="w-28" />
        <SkeletonBar
          radius="xl"
          className="h-[290px] w-full md:h-[274px]"
          tone={100}
        />
      </div>
    </ContentContainer>
  );
}
