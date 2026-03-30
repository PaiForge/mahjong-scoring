import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DrillIntroContent } from "../_components/drill-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
    description: t("description"),
  };
}

export default function TehaiFuPage() {
  return <DrillIntroContent namespace="tehaiFu" slug="tehai-fu" />;
}
