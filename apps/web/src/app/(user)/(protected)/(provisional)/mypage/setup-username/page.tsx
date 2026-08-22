import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPrivateMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { requireProvisionalUser } from "@/lib/auth";

import { UsernameForm } from "./_components/username-form";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("setupUsername", "title");
}

export default async function SetupUsernamePage() {
  await requireProvisionalUser();
  const t = await getTranslations("setupUsername");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <section className="space-y-4">
        <SectionTitle>{t("sectionTitle")}</SectionTitle>
        <UsernameForm />
      </section>
    </ContentContainer>
  );
}
