import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillCard } from "./_components/drill-card";

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

const drills: readonly DrillDef[] = [
  { href: "/practice/jantou-fu/play", titleKey: "drills.jantouFu.title", descriptionKey: "drills.jantouFu.description", difficulty: "beginner", learnHref: "/learn/jantou-fu" },
  { href: "/practice/machi-fu/play", titleKey: "drills.machiFu.title", descriptionKey: "drills.machiFu.description", difficulty: "beginner", learnHref: "/learn/machi-fu" },
  { href: "/practice/mentsu-fu/play", titleKey: "drills.mentsuFu.title", descriptionKey: "drills.mentsuFu.description", difficulty: "intermediate", learnHref: "/learn/mentsu-fu" },
  { href: "/practice/tehai-fu/play", titleKey: "drills.tehaiFu.title", descriptionKey: "drills.tehaiFu.description", difficulty: "advanced", learnHref: "/learn/tehai-fu" },
  { href: "/practice/yaku/play", titleKey: "drills.yaku.title", descriptionKey: "drills.yaku.description", difficulty: "intermediate", learnHref: "/learn/yaku" },
  { href: "/practice/score", titleKey: "drills.score.title", descriptionKey: "drills.score.description", difficulty: "advanced" },
];

export default async function PracticePage() {
  const t = await getTranslations("practice");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-2 text-sm text-surface-500">{t("description")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {drills.map((drill) => (
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
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-surface-900">{t("progress")}</h2>
        <p className="mt-1 text-sm text-surface-400">{t("progressSignInPrompt")}</p>
      </div>
    </ContentContainer>
  );
}
