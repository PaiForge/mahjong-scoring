import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("contact.success", "title");
}

/** お問い合わせの送信完了 */
export default async function ContactSuccessPage() {
  const t = await getTranslations("contact");

  return (
    <ContentContainer breadcrumb={[{ label: t("success.title") }]}>
      <PageTitle>{t("success.title")}</PageTitle>
      <div className="w-full max-w-lg mx-auto space-y-6">
        <p className="text-surface-700 leading-relaxed">
          {t("success.message")}
        </p>
        <LinkButton href="/" variant="neutral" size="lg" fullWidth>
          {t("success.backToHome")}
        </LinkButton>
      </div>
    </ContentContainer>
  );
}
