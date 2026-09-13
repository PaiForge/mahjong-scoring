import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";

import { ContactConfirm } from "../_components/contact-confirm";
import { readContactParams } from "../_lib/contact-params";

interface ContactConfirmPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("contact.confirm", "title");
}

/**
 * お問い合わせの送信内容確認
 *
 * 内容は入力画面からクエリで受け取る。揃っていなければ（直接 URL を
 * 開いた等）入力画面へ戻す。
 */
export default async function ContactConfirmPage({
  searchParams,
}: ContactConfirmPageProps) {
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
      <ContactConfirm formData={formData} />
    </ContentContainer>
  );
}
