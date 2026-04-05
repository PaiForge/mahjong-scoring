/**
 * 練習一覧
 *
 * @description 練習一覧ページ。符計算・翻数の各練習をカテゴリ別に表示する。
 * @flow 練習カードから各練習の説明ページまたはプレイページへ遷移する。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRightIcon } from "@/app/_components/icons/chevron-right-icon";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillCard } from "./_components/drill-card";
import { DrillCategorySection } from "./_components/drill-category-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("practice");
  return createMetadata({ title: t("title"), description: t("description") });
}

type Difficulty = "beginner" | "intermediate" | "advanced";

interface DrillDef {
  href: string;
  titleKey: string;
  descriptionKey: string;
  difficulty: Difficulty;
  learnHref?: string;
}

const fuDrills: readonly DrillDef[] = [
  { href: "/practice/jantou-fu/play", titleKey: "drills.jantouFu.title", descriptionKey: "drills.jantouFu.description", difficulty: "beginner", learnHref: "/learn/jantou-fu" },
  { href: "/practice/machi-fu/play", titleKey: "drills.machiFu.title", descriptionKey: "drills.machiFu.description", difficulty: "beginner", learnHref: "/learn/machi-fu" },
  { href: "/practice/mentsu-fu/play", titleKey: "drills.mentsuFu.title", descriptionKey: "drills.mentsuFu.description", difficulty: "intermediate", learnHref: "/learn/mentsu-fu" },
  { href: "/practice/tehai-fu/play", titleKey: "drills.tehaiFu.title", descriptionKey: "drills.tehaiFu.description", difficulty: "advanced", learnHref: "/learn/tehai-fu" },
];

const hanDrills: readonly DrillDef[] = [
  { href: "/practice/yaku/play", titleKey: "drills.yaku.title", descriptionKey: "drills.yaku.description", difficulty: "intermediate", learnHref: "/learn/yaku" },
  { href: "/practice/han-count/play", titleKey: "drills.hanCount.title", descriptionKey: "drills.hanCount.description", difficulty: "advanced" },
];

const scoringDrills: readonly DrillDef[] = [
  { href: "/practice/score-table/play", titleKey: "drills.scoreTable.title", descriptionKey: "drills.scoreTable.description", difficulty: "intermediate" },
  { href: "/practice/score-calculation/play", titleKey: "drills.scoreCalculation.title", descriptionKey: "drills.scoreCalculation.description", difficulty: "advanced" },
];

function renderDrillCards(
  drills: readonly DrillDef[],
  t: Awaited<ReturnType<typeof getTranslations<"practice">>>,
) {
  return drills.map((drill) => (
    <DrillCard
      key={drill.href}
      href={drill.href}
      title={t(drill.titleKey)}
      description={t(drill.descriptionKey)}
      difficulty={drill.difficulty}
      difficultyLabel={t(`difficulty.${drill.difficulty}`)}
      startLabel={t("start")}
      learnHref={drill.learnHref}
      learnLabel={drill.learnHref ? t("learn") : undefined}
    />
  ));
}

export default async function PracticePage() {
  const t = await getTranslations("practice");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-3 text-sm text-surface-500">{t("description")}</p>

      <Link
        href="/practice/score"
        className="mt-6 flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-sm transition-colors hover:bg-surface-50"
      >
        <span className="text-3xl" aria-hidden="true">♾️</span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-surface-900">{t("comprehensiveBanner.title")}</h2>
          <p className="mt-1 text-sm text-surface-500">{t("comprehensiveBanner.description")}</p>
        </div>
        <ChevronRightIcon className="size-5 shrink-0 text-surface-400" />
      </Link>

      <div className="mt-8 space-y-10">
        <DrillCategorySection title={t("categories.fuCalculation.title")}>
          {renderDrillCards(fuDrills, t)}
        </DrillCategorySection>

        <DrillCategorySection title={t("categories.han.title")}>
          {renderDrillCards(hanDrills, t)}
        </DrillCategorySection>

        <DrillCategorySection title={t("categories.scoring.title")}>
          {renderDrillCards(scoringDrills, t)}
        </DrillCategorySection>
      </div>
    </ContentContainer>
  );
}
