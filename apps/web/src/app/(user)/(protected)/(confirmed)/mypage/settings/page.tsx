/**
 * アカウント設定
 *
 * @description ログインユーザーのアカウント設定ページ。退会など、アカウントに関わる操作を集約する。
 * @flow マイページ（ユーザーメニュー）→ 設定 → 退会（/mypage/settings/delete-account）
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { RuleSettingsSection } from "./_components/rule-settings-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const tMypage = await getTranslations("mypage");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <section className="space-y-4">
          <SectionTitle>{t("rulesSectionTitle")}</SectionTitle>
          <RuleSettingsSection />
        </section>

        <section className="space-y-4">
          <SectionTitle>{t("dangerZoneTitle")}</SectionTitle>
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h3 className="text-sm font-semibold text-surface-900">
              {t("deleteAccountTitle")}
            </h3>
            <p className="mt-1 text-sm text-surface-600">
              {t("deleteAccountDescription")}
            </p>
            <Link
              href="/mypage/settings/delete-account"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              {t("deleteAccountLink")}
            </Link>
          </div>
        </section>
      </div>
    </ContentContainer>
  );
}
