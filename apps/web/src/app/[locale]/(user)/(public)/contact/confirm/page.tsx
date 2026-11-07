import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";

import { ContactConfirm } from "../_components/contact-confirm";
import { readContactParams } from "../_lib/contact-params";
import { prepareRouteLocale } from "@/i18n/route-locale";

interface ContactConfirmPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact/confirm">): Promise<Metadata> {
  await prepareRouteLocale(params, "/contact/confirm");
  return createPrivateMetadata("contact.confirm", "title");
}

/**
 * お問い合わせの送信内容確認
 *
 * 内容は入力画面からクエリで受け取る。揃っていなければ（直接 URL を
 * 開いた等）入力画面へ戻す。
 */
export default async function ContactConfirmPage({
  params,
  searchParams,
}: ContactConfirmPageProps &
  Pick<PageProps<"/[locale]/contact/confirm">, "params">) {
  await prepareRouteLocale(params, "/contact/confirm");
  const formData = readContactParams(await searchParams);
  if (!formData) {
    redirect("/contact");
  }

  const t = await getTranslations("contact");

  return (
    <ContentContainer
      breadcrumb={[
        { label: t("pageTitle"), href: "/contact" },
        { label: t("confirm.title") },
      ]}
    >
      <PageTitle>{t("confirm.title")}</PageTitle>
      <section className="space-y-6">
        <SectionTitle>{t("confirm.sectionTitle")}</SectionTitle>
        <ContactConfirm formData={formData} />
      </section>
    </ContentContainer>
  );
}
