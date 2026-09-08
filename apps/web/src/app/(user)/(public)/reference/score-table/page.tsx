import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { ScoreTableFromQuery } from "./_components/score-table-from-query";
import { ScoreTableSkeleton } from "./_components/score-table-skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("scoreTable", {
    title: "pageTitle",
    description: "pageDescription",
    path: "/reference/score-table",
  });
}

export default async function ReferenceScoreTablePage() {
  const t = await getTranslations("scoreTable");
  const tHub = await getTranslations("reference");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tHub("title"), href: "/reference" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <Suspense fallback={<ScoreTableSkeleton />}>
        <ScoreTableFromQuery />
      </Suspense>
    </ContentContainer>
  );
}
