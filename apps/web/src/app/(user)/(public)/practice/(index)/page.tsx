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
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
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
  tRanks: Awaited<ReturnType<typeof getTranslations<"ranks">>>,
) {
  return practices.map((practice) => (
    <PracticeCard
      key={practice.slug}
      href={practiceHref(practice.slug)}
      title={t(practiceTitleKey(practice.slug))}
      description={t(practiceDescriptionKey(practice.slug))}
      rank={
        practice.rank
          ? { slug: practice.rank, label: tRanks(`names.${practice.rank}`) }
          : undefined
      }
      startLabel={t("start")}
      learnHref={
        practice.learnChapter ? chapterHref(practice.learnChapter) : undefined
      }
      learnLabel={practice.learnChapter ? t("learn") : undefined}
    />
  ));
}

export default async function PracticePage() {
  const [t, tRanks] = await Promise.all([
    getTranslations("practice"),
    getTranslations("ranks"),
  ]);

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-8">
        {/* 総合演習には見出しを付けない。バナー自身が名前を持っており、
            ここに h2 を足すと下のカテゴリ見出しと同じ pill が入れ子に並んで
            「符の計算・翻数・点数計算が総合演習の下位」に見えてしまう。 */}
        <ComprehensivePracticeBanner />

        <div className="space-y-10">
          <PracticeCategorySection title={t("categories.fuCalculation.title")}>
            {renderPracticeCards(
              practiceMenusByCategory("fuCalculation"),
              t,
              tRanks,
            )}
          </PracticeCategorySection>

          <PracticeCategorySection title={t("categories.han.title")}>
            {renderPracticeCards(practiceMenusByCategory("han"), t, tRanks)}
          </PracticeCategorySection>

          <PracticeCategorySection title={t("categories.scoring.title")}>
            {renderPracticeCards(practiceMenusByCategory("scoring"), t, tRanks)}
          </PracticeCategorySection>
        </div>

        {/* 昇級試験は練習カードにしない（合格ラインを持ち段級位が授与される、
            練習とは種類の違うコンテンツ）。入口は道場が持つため、ここは
            見に行くだけの行リンクで送る。 */}
        <LinkRowList>
          <LinkRow
            href="/dojo"
            leading={
              <span className="text-base" aria-hidden="true">
                🥋
              </span>
            }
            title={t("dojoRow.title")}
            description={t("dojoRow.description")}
          />
        </LinkRowList>
      </div>
    </ContentContainer>
  );
}
