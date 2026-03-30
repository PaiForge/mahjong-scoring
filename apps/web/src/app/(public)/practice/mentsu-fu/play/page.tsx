import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { MentsuFuDrill } from "../_components/mentsu-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mentsuFu");
  return createMetadata({ title: t("title") });
}

export default function MentsuFuPlayPage() {
  return <MentsuFuDrill />;
}
