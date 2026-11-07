import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact/success">): Promise<Metadata> {
  await prepareRouteLocale(params, "/contact/success");
  return createPrivateMetadata("contact.success", "title");
}

/** お問い合わせの送信完了 */
export default async function ContactSuccessPage({
  params,
}: PageProps<"/[locale]/contact/success">) {
  await prepareRouteLocale(params, "/contact/success");
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
