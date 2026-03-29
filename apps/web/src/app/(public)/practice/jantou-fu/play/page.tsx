import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JantouFuDrill } from "../_components/jantou-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jantouFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
  };
}

export default function JantouFuPlayPage() {
  return <JantouFuDrill />;
}
