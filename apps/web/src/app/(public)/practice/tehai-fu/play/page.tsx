import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { TehaiFuDrill } from "../_components/tehai-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu");
  return createMetadata({ title: t("title") });
}

export default function TehaiFuPlayPage() {
  return <TehaiFuDrill />;
}
