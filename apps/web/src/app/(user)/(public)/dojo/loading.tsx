import { getTranslations } from "next-intl/server";

import { getChapterBySlug } from "@/app/(user)/(public)/learn/_lib/curriculum";
import { CURRICULUM_SECTIONS } from "@/app/(user)/(public)/learn/_lib/curriculum";
import { CurriculumTocSkeleton } from "@/app/(user)/(public)/learn/_components/curriculum-toc-skeleton";
import { SECTION_LABEL_WIDTH_CLASS } from "@/app/(user)/(public)/learn/_lib/toc-layout";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { nextRank } from "@/lib/ranks/registry";

/**
 * 道場の読み込み中スケルトン。
 *
 * 実体（`dojo/page.tsx`）の「リード文 → 現在の段級位 → 前提となる教本の章 →
 * 昇級試験」を同じ順・同じ高さで模す。汎用の `PageSkeleton` では丈が
 * 522px しかなく、実体の 1371px との差でフッターが押し下げられていた
 * （420x900 で CLS 0.301 を実測）。
 *
 * リード文は辞書から引いた実物を出す。段級位にも読了にも依らない静的な
 * 文字列で、しかも高さが折り返しで決まるため、矩形では幅ごとに行数がずれる。
 * 見出しはプレースホルダで受ける — 同じ形のクラスを共有していて高さは
 * 一致するし、フォールバックは初期 HTML に焼き込まれるので、実物を出すと
 * 同じ h1 / h2 が本物より先に 2 つ目として文書に並ぶ。
 *
 * 形は「まだ級を持たないユーザー」（未ログインを含む）に合わせている。
 * 次の級は `nextRank([])` = 最初の級で、その前提章の数がそのまま目次の
 * 行数になる。級を持つユーザーでは前提章の数が変わるため丈がずれるが、
 * 道場は未ログインでも開ける公開ページで、段級位カードの下に出る
 * ログイン導線（2 行）を含むこの状態が既定の姿。
 */
export default async function Loading() {
  const t = await getTranslations("dojo");
  const rank = nextRank([]);
  const chapterSections = CURRICULUM_SECTIONS.map((section) => ({
    section,
    chapterCount: (rank?.learnChapterSlugs ?? []).filter(
      (slug) => getChapterBySlug(slug)?.section === section,
    ).length,
  })).filter(({ chapterCount }) => chapterCount > 0);

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitlePlaceholder width="w-16" />

      <div className="space-y-8">
        <p className="text-sm leading-relaxed text-surface-500">{t("lead")}</p>

        {/* 現在の段級位: 帯バッジ + 級名 + 未ログイン時のログイン導線で 198px */}
        <section className="space-y-4">
          <SectionTitleSkeleton width="w-28" />
          <SkeletonBar radius="xl" className="h-[198px] w-full" tone={100} />
        </section>

        {chapterSections.length > 0 && (
          <section className="space-y-4">
            <SectionTitleSkeleton width="w-40" />
            <p className="text-sm leading-relaxed text-surface-500">
              {t("chaptersLead")}
            </p>
            {/* 実体の ChapterTocList と同じ space-y-6。行数は次の級の前提章から数える */}
            <div className="space-y-6">
              {chapterSections.map(({ section, chapterCount }) => (
                <CurriculumTocSkeleton
                  key={section}
                  chapterCount={chapterCount}
                  labelWidthClassName={SECTION_LABEL_WIDTH_CLASS[section]}
                />
              ))}
            </div>
            {/* 「目次へ」の右寄せリンク */}
            <div className="flex justify-end">
              <SkeletonBar className="h-5 w-20" tone={100} />
            </div>
          </section>
        )}

        {/* 昇級試験カード: リード文 + 合格基準 + ボタンで 201px */}
        <section className="space-y-4">
          <SectionTitleSkeleton width="w-28" />
          <SkeletonBar radius="xl" className="h-[201px] w-full" tone={100} />
        </section>
      </div>
    </ContentContainer>
  );
}
