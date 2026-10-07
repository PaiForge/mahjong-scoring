import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/**
 * ダッシュボードの読み込み中スケルトン。
 *
 * 実体（HomeDashboard）の先頭のセクション「次にやること」（見出し +
 * 帯色のカード）を同じ高さで模す。行程が進行中のあいだ実体は「次にやること」
 * → お知らせの 2 つだけで、「教本の続き」は全級取得済みのユーザーにしか
 * 出ないため写さない（写すと大多数のユーザーで、実体に無い進捗バーと章カードが
 * カードの下に出る）。
 *
 * 「次にやること」のカードは、級の見出し・進み具合のステップ表示・ボタン
 * （50px）・下のリンク（20px）に、`space-y-4` の間隔と `p-5` の余白を足した
 * 高さ。見出しが帯バッジの丈（48px = 2 行）に収まるあいだは 271px
 * （2026-10-07 に 390px・1280px 幅で実測）。合格基準の長い 3級・2級・1級が
 * 次の目標のときだけ、sm 未満で見出しが 3 行になりカードが 24px 伸びる
 * （2026-10-05 に 390px 幅で実測）。スケルトンは級を知らないので、登録直後の
 * 全員が通る 5級の形（271px）に合わせる。
 * 上端の帯色は写さずグレーの矩形にする
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
        <SkeletonBar radius="lg" className="h-[271px] w-full" tone={100} />
      </div>
    </ContentContainer>
  );
}
