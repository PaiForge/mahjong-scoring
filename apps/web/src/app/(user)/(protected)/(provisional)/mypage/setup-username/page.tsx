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
        {/* 確認メールのリンクや Google から着いた人は登録済みのつもりでいるため、
            まだ途中であることと、この画面で何を決めるかを先に伝える */}
        <p className="text-sm leading-relaxed text-surface-500">{t("lead")}</p>
        <UsernameForm />
      </section>
    </ContentContainer>
  );
}
