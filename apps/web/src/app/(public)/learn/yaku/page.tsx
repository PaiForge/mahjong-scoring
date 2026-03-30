import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { YakuGuide } from "./_components/yaku-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yaku.learn");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

export default function LearnYakuPage() {
  return (
    <LearnPageLayout namespace="yaku.learn" playHref="/practice/yaku/play">
      <YakuGuide />
    </LearnPageLayout>
  );
}
