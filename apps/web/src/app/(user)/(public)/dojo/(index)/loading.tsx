import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";

/**
 * 道場の読み込み中スケルトン。
 *
 * 実体（`dojo/(index)/page.tsx`）の「現在の段級位（1 行）→ 次の目標（開いた
 * カード）→ 黒帯への道（閉じたカードの並び）」を同じ順・同じ高さで模す。
 *
 * 見出しはプレースホルダで受ける — 同じ形のクラスを共有していて高さは
 * 一致するし、フォールバックは初期 HTML に焼き込まれるので、実物を出すと
 * 同じ h1 / h2 が本物より先に 2 つ目として文書に並ぶ。
 *
 * 形は「まだ級を持たないユーザー」（未ログインを含む）に合わせている。
 * 次の目標は 5級で、開いたカードの丈はレッスン 5 行（章の説明付き）・
 * 練習 6 行・試験のボタンを足したもの。黒帯への道の 5級のカードは次の目標
 * なので施錠の注記が無く、他の級より 1 行低い。級を持つユーザーでは次の目標の
 * 級が変わり前提章と練習の数も変わるため丈がずれるが、道場は未ログインでも
 * 開ける公開ページで、この状態が既定の姿。
 */
export default async function Loading() {
  const t = await getTranslations("dojo");

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitlePlaceholder width="w-16" />

      <div className="space-y-8">
        {/* 現在の段級位: 帯バッジ + ラベル + 級名 + 未ログイン時のログイン導線。
            実測（2026-10-05）で 90px、ログイン導線が折り返す 390px 幅で 106px */}
        <SkeletonBar
          radius="xl"
          className="h-[106px] w-full sm:h-[90px]"
          tone={100}
        />

        {/* 次の目標: 開いた 5級のカード。実測（2026-10-05）で 975px（sm 以上 983px） */}
        <section className="space-y-4">
          <SectionTitleSkeleton width="w-24" />
          <SkeletonBar
            radius="xl"
            className="h-[975px] w-full sm:h-[983px]"
            tone={100}
          />
        </section>

        <section className="space-y-4">
          <SectionTitleSkeleton width="w-48" />
          <div className="space-y-4">
            {RANK_REGISTRY.map((rank, index) => (
              <SkeletonBar
                key={rank.slug}
                radius="xl"
                // 実測（2026-10-05）: 次の目標の 5級は 156px（sm 以上 164px）、
                // 施錠の注記を持つ他の級は 180px（sm 以上 188px）
                className={
                  index === 0
                    ? "h-[156px] w-full sm:h-[164px]"
                    : "h-[180px] w-full sm:h-[188px]"
                }
                tone={100}
              />
            ))}
          </div>
        </section>
      </div>
    </ContentContainer>
  );
}
