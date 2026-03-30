import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { JantouFuDrill } from "../_components/jantou-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jantouFu");
  return createMetadata({ title: t("title") });
}

export default function JantouFuPlayPage() {
  return <JantouFuDrill />;
}
