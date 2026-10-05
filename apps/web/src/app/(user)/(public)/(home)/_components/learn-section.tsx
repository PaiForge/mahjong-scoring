import { useTranslations } from "next-intl";

import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { ChapterTocList } from "@/app/(user)/(public)/lessons/_components/chapter-toc-list";
import { CURRICULUM_CHAPTER_SLUGS } from "@mahjong-scoring/features/curriculum/registry";

import { LandingSection } from "./landing-section";

/**
 * トップの「基礎から学ぶ」節
 * レッスンの紹介
 *
 * 全レッスンを目次の書式（`ChapterTocList`）でそのまま並べる。トップは
 * 検索エンジンが最初に評価するページで、コピーだけでは「何が学べるか」が
 * 伝わらない。レッスンのタイトルと 1 行説明が本文になり、全レッスンへの
 * 内部リンクにもなる。完了の印は出さない（トップは cookie を読まない静的ページ）。
 */
export function LearnSection() {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="bg-white"
      icon={<BookIcon className="size-8" />}
      iconClassName="bg-primary-200 text-primary-800"
      title={t("learnTitle")}
      description={t("learnDescription")}
      href="/lessons"
      ctaLabel={t("learnCta")}
      ctaVariant="secondary"
    >
      <div className="w-full max-w-2xl text-left">
        <ChapterTocList
          slugs={CURRICULUM_CHAPTER_SLUGS}
          completedSlugs={new Set<string>()}
        />
      </div>
    </LandingSection>
  );
}
