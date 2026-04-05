import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SetupScreen } from "./_components/setup-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("score");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default async function ScoreSetupPage() {
  const t = await getTranslations("score");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-3 text-sm text-surface-500">{t("description")}</p>
      <SetupScreen />
    </ContentContainer>
  );
}
