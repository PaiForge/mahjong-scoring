import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import { ScoreTable } from "./_components/score-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTable");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

export default async function ReferencePage() {
  const t = await getTranslations("scoreTable");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <p className="mt-2 text-sm text-surface-500">{t("pageDescription")}</p>

      <div className="mt-6">
        <ScoreTable />
      </div>
    </ContentContainer>
  );
}
