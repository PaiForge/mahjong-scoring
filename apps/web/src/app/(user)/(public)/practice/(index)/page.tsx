/**
 * 練習一覧
 *
 * @description 練習一覧ページ。符計算・翻数の各練習をカテゴリ別に表示する。
 * @flow 練習カードから各練習の説明ページまたはプレイページへ遷移する。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
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
  return createNamespaceMetadata("practice");
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
      learnHref={practice.learnHref}
      learnLabel={practice.learnHref ? t("learn") : undefined}
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

        <Link
          href="/practice/score"
          className="press-sm flex items-center gap-4 rounded-2xl border-3 border-ink bg-white p-6 shadow-sm hover:bg-primary-50"
        >
          <span className="text-3xl" aria-hidden="true">
            ♾️
          </span>
          <div className="flex-1">
            <h3 className="text-base font-bold text-surface-900">
              {t("comprehensiveBanner.title")}
            </h3>
            <p className="mt-1 text-sm font-medium text-surface-500">
              {t("comprehensiveBanner.description")}
            </p>
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-surface-400" />
        </Link>

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
