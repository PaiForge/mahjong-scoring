import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { MachiFuDrill } from "../_components/machi-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("machiFu");
  return createMetadata({ title: t("title") });
}

export default function MachiFuPlayPage() {
  return <MachiFuDrill />;
}
