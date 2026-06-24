import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { AboutThisAppGuide } from "./_components/about-this-app-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutThisApp.learn");
  return createMetadata({
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}

export default function LearnAboutThisAppPage() {
  return (
    <LearnPageLayout slug="about-this-app" namespace="aboutThisApp.learn">
      <AboutThisAppGuide />
    </LearnPageLayout>
  );
}
