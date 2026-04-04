import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ScoreCalculationDrill } from "../_components/score-calculation-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreCalculationDrill");
  return createMetadata({ title: t("title") });
}

export default function ScoreCalculationPlayPage() {
  return <ScoreCalculationDrill />;
}
