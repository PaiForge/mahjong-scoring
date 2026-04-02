import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MentsuFuGuide } from "./_components/mentsu-fu-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mentsuFu.learn");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

export default function LearnMentsuFuPage() {
  return (
    <LearnPageLayout namespace="mentsuFu.learn" playHref="/practice/mentsu-fu/play">
      <MentsuFuGuide />
    </LearnPageLayout>
  );
}
