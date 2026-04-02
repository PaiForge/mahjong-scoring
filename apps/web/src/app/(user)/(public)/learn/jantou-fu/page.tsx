import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { JantouFuGuide } from "./_components/jantou-fu-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jantouFu.learn");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

export default function LearnJantouFuPage() {
  return (
    <LearnPageLayout namespace="jantouFu.learn" playHref="/practice/jantou-fu/play">
      <JantouFuGuide />
    </LearnPageLayout>
  );
}
