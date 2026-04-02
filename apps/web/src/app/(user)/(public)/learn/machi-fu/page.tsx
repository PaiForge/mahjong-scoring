import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { LearnPageLayout } from "../_components/learn-page-layout";
import { MachiFuGuide } from "./_components/machi-fu-guide";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("machiFu.learn");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

export default function LearnMachiFuPage() {
  return (
    <LearnPageLayout namespace="machiFu.learn" playHref="/practice/machi-fu/play">
      <MachiFuGuide />
    </LearnPageLayout>
  );
}
