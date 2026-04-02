import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillBoard } from "../_components/drill-board";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("score");
  return createMetadata({ title: t("title") });
}

export default function ScorePlayPage() {
  return <DrillBoard />;
}
