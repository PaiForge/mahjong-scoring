import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillIntroContent } from "../_components/drill-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jantouFu");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default function JantouFuPage() {
  return <DrillIntroContent namespace="jantouFu" slug="jantou-fu" />;
}
