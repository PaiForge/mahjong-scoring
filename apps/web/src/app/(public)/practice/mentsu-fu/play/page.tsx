import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MentsuFuDrill } from "../_components/mentsu-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mentsuFu");
  return {
    title: `${t("title")} - Mahjong Scoring`,
  };
}

export default function MentsuFuPlayPage() {
  return <MentsuFuDrill />;
}
