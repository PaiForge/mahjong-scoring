import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return createMetadata({ title: t("signInPageTitle") });
}

export default async function SignInPage() {
  const t = await getTranslations("auth");

  return (
    <ContentContainer>
      <PageTitle>{t("signInPageTitle")}</PageTitle>
      <p className="mt-4 text-sm text-surface-500">{t("comingSoon")}</p>
    </ContentContainer>
  );
}
