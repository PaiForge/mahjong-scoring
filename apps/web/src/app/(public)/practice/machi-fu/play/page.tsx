import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MachiFuDrill } from "../_components/machi-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("machiFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
  };
}

export default function MachiFuPlayPage() {
  return <MachiFuDrill />;
}
