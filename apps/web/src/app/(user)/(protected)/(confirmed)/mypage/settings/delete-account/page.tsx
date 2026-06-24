/**
 * 退会
 *
 * @description アカウント退会の確認ページ。退会の影響を説明し、確認のうえアカウントを削除する。
 * @flow 設定 → 退会 → 確認モーダル → アカウント削除 → トップへ遷移（ログアウト）
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

import { DeleteAccountButton } from "./_components/delete-account-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deleteAccount");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

export default async function DeleteAccountPage() {
  const t = await getTranslations("deleteAccount");
  const tMypage = await getTranslations("mypage");
  const tSettings = await getTranslations("settings");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: tSettings("pageTitle"), href: "/mypage/settings" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="mt-6 space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <p className="text-sm leading-relaxed text-surface-700">
            {t("warning")}
          </p>
        </div>

        <DeleteAccountButton />

        <div>
          <Link
            href="/mypage/settings"
            className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            {t("backToSettings")}
          </Link>
        </div>
      </div>
    </ContentContainer>
  );
}
