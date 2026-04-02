import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { YakuDrill } from "../_components/yaku-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yaku");
  return createMetadata({ title: t("title") });
}

export default function YakuPlayPage() {
  return <YakuDrill />;
}
