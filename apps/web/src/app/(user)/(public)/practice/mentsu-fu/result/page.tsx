import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ResultClient } from "../../_components/result-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mentsuFu");
  const tChallenge = await getTranslations("challenge");
  return createMetadata({ title: `${t("title")} - ${tChallenge("resultSuffix")}` });
}

export default function MentsuFuResultPage() {
  return (
    <Suspense>
      <ResultClient playHref="/practice/mentsu-fu/play" />
    </Suspense>
  );
}
