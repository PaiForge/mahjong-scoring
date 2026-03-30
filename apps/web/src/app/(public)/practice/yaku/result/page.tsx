import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ResultClient } from "../../_components/result-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yaku");
  return createMetadata({ title: `${t("title")} - 結果` });
}

export default function YakuResultPage() {
  return (
    <Suspense>
      <ResultClient playHref="/practice/yaku/play" />
    </Suspense>
  );
}
