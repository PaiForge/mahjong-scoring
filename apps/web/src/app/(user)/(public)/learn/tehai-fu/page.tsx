import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { TehaiFuGuide } from "./_components/tehai-fu-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu.learn");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

export default function LearnTehaiFuPage() {
  return (
    <LearnPageLayout namespace="tehaiFu.learn" playHref="/practice/tehai-fu/play">
      <TehaiFuGuide />
    </LearnPageLayout>
  );
}
