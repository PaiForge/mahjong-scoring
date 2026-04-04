import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ScoreTableDrill } from "../_components/score-table-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTableDrill");
  return createMetadata({ title: t("title") });
}

export default function ScoreTablePlayPage() {
  return <ScoreTableDrill />;
}
