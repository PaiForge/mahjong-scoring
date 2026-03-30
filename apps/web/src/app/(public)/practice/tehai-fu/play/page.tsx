import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TehaiFuDrill } from "../_components/tehai-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
  };
}

export default function TehaiFuPlayPage() {
  return <TehaiFuDrill />;
}
