import { useTranslations } from "next-intl";

import { BookIcon } from "@/app/[locale]/(user)/_components/icons/book-icon";
import { ChapterTocList } from "@/app/[locale]/(user)/(public)/lessons/_components/chapter-toc-list";
import { CURRICULUM_CHAPTER_SLUGS } from "@mahjong-scoring/features/curriculum/registry";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { LandingSection } from "./landing-section";
import { LESSONS_PATH } from "@mahjong-scoring/features/routes";

/**
 * トップの「基礎から学ぶ」節
 * レッスンの紹介
 *
 * 全レッスンを目次の書式（`ChapterTocList`）でそのまま並べる。トップは
 * 検索エンジンが最初に評価するページで、コピーだけでは「何が学べるか」が
 * 伝わらない。レッスンのタイトルと 1 行説明が本文になり、全レッスンへの
 * 内部リンクにもなる。完了の印は出さない（トップは cookie を読まない静的ページ）。
 *
 * @param locale - ページの言語（節の CTA の張る先を決める。目次の各行の張る先は
 * `ChapterTocList` が持つ）
 */
export function LearnSection({ locale }: { readonly locale: SupportedLocale }) {
  const t = useTranslations("landing");

  return (
    <LandingSection
      sectionClassName="bg-white"
      icon={<BookIcon className="size-8" />}
      iconClassName="bg-brand-subtle text-brand-subtle-foreground"
      title={t("learnTitle")}
      description={t("learnDescription")}
      href={LESSONS_PATH}
      locale={locale}
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
