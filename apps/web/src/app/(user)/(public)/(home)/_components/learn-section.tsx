import { useTranslations } from "next-intl";

import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { ChapterTocList } from "@/app/(user)/(public)/learn/_components/chapter-toc-list";
import { CURRICULUM_CHAPTER_SLUGS } from "@/app/(user)/(public)/learn/_lib/curriculum";

import { LandingSection } from "./landing-section";

/**
 * トップの「基礎から学ぶ」節
 * 教本の紹介
 *
 * 教本の全章を目次の書式（`ChapterTocList`）でそのまま並べる。トップは
 * 検索エンジンが最初に評価するページで、コピーだけでは「何が学べるか」が
 * 伝わらない。章のタイトルと 1 行説明が本文になり、18 章への内部リンクにもなる。
 * 読了チェックは出さない（トップは cookie を読まない静的ページ）。
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
      href="/learn"
      ctaLabel={t("learnCta")}
      ctaVariant="secondary"
    >
      <div className="w-full max-w-2xl text-left">
        <ChapterTocList
          slugs={CURRICULUM_CHAPTER_SLUGS}
          readSlugs={new Set<string>()}
        />
      </div>
    </LandingSection>
  );
}
