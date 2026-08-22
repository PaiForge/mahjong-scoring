import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createTitleOnlyMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

export async function generateMetadata(): Promise<Metadata> {
  return createTitleOnlyMetadata("terms", "pageTitle");
}

export default async function TermsPage() {
  const t = await getTranslations("terms");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <p className="text-sm text-surface-500">{t("comingSoon")}</p>
    </ContentContainer>
  );
}
