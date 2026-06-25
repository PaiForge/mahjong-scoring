/**
 * アカウント設定
 *
 * @description ログインユーザーのアカウント設定ページ。ルール設定などを集約する。退会はプロフィール編集ページから行う。
 * @flow マイページ（ユーザーメニュー）→ 設定
 */
import type { Metadata } from "next";
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
      </div>
    </ContentContainer>
  );
}
