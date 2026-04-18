import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import { ScoreTable } from "./_components/score-table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTable");
  return createMetadata({ title: t("pageTitle"), description: t("pageDescription") });
}

export default async function ReferencePage() {
  const t = await getTranslations("scoreTable");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <p className="mt-3 text-sm text-surface-500">{t("pageDescription")}</p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="w-full space-y-3">
              <div className="flex justify-end gap-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="h-8 w-20 bg-surface-200 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-[400px] w-full rounded-xl border border-surface-200 bg-surface-50 animate-pulse" />
            </div>
          }
        >
          <ScoreTable />
        </Suspense>
      </div>
    </ContentContainer>
  );
}
