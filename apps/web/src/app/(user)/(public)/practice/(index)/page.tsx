/**
 * 練習一覧
 *
 * @description 練習一覧ページ。符計算・翻数の各練習をカテゴリ別に表示する。
 * @flow 練習カードから各練習の説明ページまたはプレイページへ遷移する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { chapterHref } from "@/app/(user)/(public)/learn/_lib/curriculum";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { ComprehensivePracticeBanner } from "../_components/comprehensive-practice-banner";
import { PracticeCard } from "../_components/practice-card";
import { PracticeCategorySection } from "../_components/practice-category-section";
import {
  practiceDescriptionKey,
  practiceHref,
  practiceMenusByCategory,
  practiceTitleKey,
  type PracticeMenu,
} from "../_lib/practice-catalog";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("practice", { path: "/practice" });
}

function renderPracticeCards(
  practices: readonly PracticeMenu[],
  t: Awaited<ReturnType<typeof getTranslations<"practice">>>,
) {
  return practices.map((practice) => (
    <PracticeCard
      key={practice.slug}
      href={practiceHref(practice.slug)}
      title={t(practiceTitleKey(practice.slug))}
      description={t(practiceDescriptionKey(practice.slug))}
      difficulty={practice.difficulty}
      difficultyLabel={t(`difficulty.${practice.difficulty}`)}
      startLabel={t("start")}
      learnHref={
        practice.learnChapter ? chapterHref(practice.learnChapter) : undefined
      }
      learnLabel={practice.learnChapter ? t("learn") : undefined}
    />
  ));
}

export default async function PracticePage() {
  const t = await getTranslations("practice");

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-8">
        <SectionTitle>{t("menuTitle")}</SectionTitle>

        <ComprehensivePracticeBanner />

        <div className="space-y-10">
          <PracticeCategorySection title={t("categories.fuCalculation.title")}>
            {renderPracticeCards(practiceMenusByCategory("fuCalculation"), t)}
          </PracticeCategorySection>

          <PracticeCategorySection title={t("categories.han.title")}>
            {renderPracticeCards(practiceMenusByCategory("han"), t)}
          </PracticeCategorySection>

          <PracticeCategorySection title={t("categories.scoring.title")}>
            {renderPracticeCards(practiceMenusByCategory("scoring"), t)}
          </PracticeCategorySection>
        </div>
      </div>
    </ContentContainer>
  );
}
