/**
 * メール確認ページ
 *
 * @description
 * メールアドレスでのサインアップ後に表示される確認ページ。
 * 確認メールの再送機能を提供する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

import { ResendEmailButton } from "./_components/resend-email-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("verifyEmail");
  return createMetadata({ title: t("pageTitle") });
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const t = await getTranslations("verifyEmail");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="mt-8 space-y-6">
        <div className="text-center space-y-3">
          <p className="text-surface-700">{t("description")}</p>
          <p className="text-sm text-surface-500">{t("checkInbox")}</p>
        </div>

        <div className="text-center">
          <ResendEmailButton email={email ?? ""} />
        </div>
      </div>
    </ContentContainer>
  );
}
