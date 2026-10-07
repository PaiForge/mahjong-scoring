import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 段級位の詳細の読み込み中スケルトン。
 *
 * 実体（`ranks/[slug]/page.tsx`）の「帯と合格基準のカード → 試験カード」を
 * 模す。前提となる教本の章の節は出さない — loading.tsx は params を受け
 * 取れず、章の数（0〜5）は級ごとに違うため、行数を決め打つとどの級でも
 * 合わない。章の節は実体が届いたときに試験カードの上へ差し込まれる。
 */
export default async function Loading() {
  const t = await getTranslations("dojo");

  return (
    <ContentContainer breadcrumb={[{ label: t("title"), href: "/dojo" }]}>
      <PageTitlePlaceholder width="w-16" />

      <div className="space-y-8">
        {/* 帯バッジ（64px）+ 枠と余白で 109px。390px 幅では合格基準が
            2 行に折り返して 118px になる（2026-10-07 に実測） */}
        <SkeletonBar
          radius="lg"
          className="h-[118px] w-full sm:h-[109px]"
          tone={100}
        />

        {/* 昇級試験カード: リード文 + 合格基準 + ボタン。390px 幅で 200px、
            640px 以上でリード文が 1 行に収まり 174px（2026-10-07 に実測） */}
        <section className="space-y-4">
          <SectionTitleSkeleton width="w-28" />
          <SkeletonBar
            radius="lg"
            className="h-[200px] w-full sm:h-[174px]"
            tone={100}
          />
        </section>
      </div>
    </ContentContainer>
  );
}
