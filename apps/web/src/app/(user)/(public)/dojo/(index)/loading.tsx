import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";

/**
 * 道場の読み込み中スケルトン。
 *
 * 実体（`dojo/(index)/page.tsx`）の「現在の段級位 → 黒帯への道（級ごとの
 * カードの並び）」を同じ順・同じ高さで模す。
 *
 * 見出しはプレースホルダで受ける — 同じ形のクラスを共有していて高さは
 * 一致するし、フォールバックは初期 HTML に焼き込まれるので、実物を出すと
 * 同じ h1 / h2 が本物より先に 2 つ目として文書に並ぶ。
 *
 * 形は「まだ級を持たないユーザー」（未ログインを含む）に合わせている。
 * 最初の級（5級）のカードだけが開いていて、残りは閉じたカード。開いた
 * カードの丈は、レッスン 5 行（章の説明付き）・練習 6 行・試験のボタンを
 * 足したもの。級を持つユーザーでは開く級が変わり前提章と練習の数も変わる
 * ため丈がずれるが、道場は未ログインでも開ける公開ページで、この状態が
 * 既定の姿。閉じたカードは「帯 + 級名と合格基準 + 進み具合 + 施錠の注記」で、どの級でも同じ丈。
 */
export default async function Loading() {
  const t = await getTranslations("dojo");

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitlePlaceholder width="w-16" />

      <div className="space-y-8">
        {/* 現在の段級位: 帯バッジ + 級名 + 未ログイン時のログイン導線で 198px */}
        <section className="space-y-4">
          <SectionTitleSkeleton width="w-28" />
          <SkeletonBar radius="xl" className="h-[198px] w-full" tone={100} />
        </section>

        <section className="space-y-4">
          <SectionTitleSkeleton width="w-48" />
          <div className="space-y-4">
            {RANK_REGISTRY.map((rank, index) => (
              <SkeletonBar
                key={rank.slug}
                radius="xl"
                // 実測（2026-10-05）: 開いた 5級のカードは 975px（sm 以上 983px）、
                // 閉じたカードは 180px（sm 以上 188px）
                className={
                  index === 0
                    ? "h-[975px] w-full sm:h-[983px]"
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
