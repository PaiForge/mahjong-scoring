import { CurriculumProgressBarSkeleton } from "@/app/(user)/(public)/learn/_components/curriculum-progress-bar-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";

/**
 * ダッシュボードの読み込み中スケルトン。
 *
 * 実体（HomeDashboard）の「教本の続き」（見出しピル + 進捗バー + 章カード +
 * 右寄せリンク + 行リンク）を実測の高さで模し、その下に汎用のセクション
 * （見出しピル + 全幅のブロック 1 枚）を 1 つ置く。
 *
 * 2 つめのセクションを汎用の形にしているのは、そこに来るものがユーザーの
 * 進捗で変わるから。「おすすめの練習」（カード 2 枚なら md 以上で 2 カラム、
 * 1 枚なら全幅）・総合演習のバナー・お知らせのいずれかが必ず 1 つ来るが、
 * どれが来るかは読み込むまで分からない。以前はおすすめの練習のカード 2 枚
 * （デスクトップで 2 カラム）を描いていたが、それ以外のユーザーには一瞬
 * 見えたカードが別物に差し替わる。「ここにセクションが来る」ことだけを示し、
 * 特定の中身の形を約束しない。
 *
 * ブロックの高さはモバイルだけ 340px（以前のカード 2 枚 + リンク行と同じ総高）に
 * している。モバイル（420x900 実測）ではこのセクションがフォールドにかかるため、
 * スケルトンが短いとフッターが画面内に入り、実体が長いユーザー（おすすめの練習が
 * 出る）でそれが画面外へ押し出されてシフトになる（144px のままだとカード 2 枚の
 * ユーザーで CLS 約 0.11 の試算）。フッターをフォールドの下に置いておけば、
 * 実体がこれより長くても短くても可視要素は動かない。md 以上ではフッターが
 * どのみち画面内にあり、高さをどう選んでもどれかの状態でずれるため、見た目の
 * 自然な 1 枚分にしている（全状態で CLS 0.04 未満の試算）。
 *
 * それ以降のセクションは描かない。上のセクションの高さが実体と一致していれば、
 * 下に追記される分は可視要素を動かさない。実体の形はユーザーの進捗で変わる
 * ため全状態との一致は原理的に不可能で、「教本の続き」は中級進捗（試験行あり）
 * に合わせている。進捗ゼロのユーザーでは実体が短くなり、フッターが繰り上がる
 * 分のシフトが出る（読了 0 は最初の章を読むまでの一時的な状態）。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-24" />

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

        {/* 2 つめのセクション（おすすめの練習・総合演習・お知らせのいずれか）:
            中身の形は進捗で変わるため、全幅のブロック 1 枚で代表させる。
            高さは md 以上で練習カード 1 枚分(144px)、モバイルでは 340px */}
        <div className="space-y-4">
          <SectionTitleSkeleton width="w-36" />
          <SkeletonBar
            radius="xl"
            className="h-[340px] w-full md:h-36"
            tone={100}
          />
        </div>
      </div>
    </ContentContainer>
  );
}
