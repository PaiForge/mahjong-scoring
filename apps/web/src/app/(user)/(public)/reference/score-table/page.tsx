import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { ScoreTableFromQuery } from "./_components/score-table-from-query";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

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

      <div className="space-y-6">
        <div className="space-y-3">
          <SectionTitle>{t("tableTitle")}</SectionTitle>
          <p className="text-sm text-surface-500">{t("pageDescription")}</p>
        </div>

        <Suspense
          fallback={
            <div className="w-full space-y-3">
              <div className="flex justify-end gap-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <SkeletonBar key={i} className="h-8 w-20" />
                ))}
              </div>
              <SkeletonBar
                radius="xl"
                className="h-[400px] w-full border-3 border-ink"
                tone={50}
              />
            </div>
          }
        >
          <ScoreTableFromQuery />
        </Suspense>
      </div>
    </ContentContainer>
  );
}
