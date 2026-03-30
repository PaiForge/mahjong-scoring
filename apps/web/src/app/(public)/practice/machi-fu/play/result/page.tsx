import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ResultClient } from "../../_components/result-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("machiFu");
  return {
    title: `${t("title")} - 結果 - Mahjong Scoring`,
  };
}

export default function MachiFuResultPage() {
  return (
    <Suspense>
      <ResultClient />
    </Suspense>
  );
}
