import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillIntroContent } from "../_components/drill-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("machiFu");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default function MachiFuPage() {
  return <DrillIntroContent namespace="machiFu" slug="machi-fu" />;
}
