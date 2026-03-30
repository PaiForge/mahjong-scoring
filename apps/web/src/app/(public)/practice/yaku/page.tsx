import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillIntroContent } from "../_components/drill-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yaku");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default function YakuPage() {
  return <DrillIntroContent namespace="yaku" slug="yaku" />;
}
