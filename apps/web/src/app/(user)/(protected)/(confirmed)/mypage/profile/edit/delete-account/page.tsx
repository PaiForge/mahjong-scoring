/**
 * 退会
 *
 * @description アカウント退会の確認ページ。退会の影響を説明し、確認のうえアカウントを削除する。
 * @flow プロフィール編集 → アカウントを削除 → 確認モーダル → 削除 → トップへ（ログアウト）
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";

import { DeleteAccountButton } from "./_components/delete-account-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deleteAccount");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

export default async function DeleteAccountPage() {
  await requireConfirmedUser();
  const t = await getTranslations("deleteAccount");
  const tMypage = await getTranslations("mypage");
  const tProfile = await getTranslations("profileEdit");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: tProfile("pageTitle"), href: "/mypage/profile/edit" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="mt-6 space-y-6">
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-surface-600">
            {t("warning")}
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-surface-600">
            <li>{t("consequences.personalData")}</li>
            <li>{t("consequences.scoresRemoved")}</li>
            <li>{t("consequences.usernameLocked")}</li>
          </ul>
        </div>

        <DeleteAccountButton />

        <div>
          <Link
            href="/mypage/profile/edit"
            className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            {t("backToProfile")}
          </Link>
        </div>
      </div>
    </ContentContainer>
  );
}
