import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DrillIntroContent } from "../_components/drill-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jantouFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
    description: t("description"),
  };
}

export default function JantouFuPage() {
  return <DrillIntroContent namespace="jantouFu" slug="jantou-fu" />;
}
