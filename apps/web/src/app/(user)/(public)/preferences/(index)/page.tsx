/**
 * 設定（環境設定）
 *
 * @description 麻雀ルールの差分設定・表示設定（いずれも端末ローカル）と
 * プライバシー設定（アカウントに紐づく）を集約するページ。
 * @flow ヘッダーのメニュー / アカウントメニュー → 設定
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createTitleOnlyMetadata } from "@/app/_lib/metadata";
import { AnchorScroll } from "../_components/anchor-scroll";
import { DisplaySettingsSection } from "../_components/display-settings-section";
import { MembersOnlyGate } from "../_components/members-only-gate";
import { PrivacySettingsSection } from "../_components/privacy-settings-section";
import { RuleSettingsSection } from "../_components/rule-settings-section";
import { TrainingSettingsSection } from "../_components/training-settings-section";

export async function generateMetadata(): Promise<Metadata> {
  return createTitleOnlyMetadata("settings", "pageTitle");
}

export default async function PreferencesPage() {
  const t = await getTranslations("settings");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <AnchorScroll />
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <MembersOnlyGate>
          <div className="space-y-8">
            <section className="space-y-4">
              <SectionTitle>{t("rulesSectionTitle")}</SectionTitle>
              <RuleSettingsSection />
            </section>

            <section className="space-y-4">
              <SectionTitle>{t("trainingSectionTitle")}</SectionTitle>
              <TrainingSettingsSection />
            </section>

            <section className="space-y-4">
              <SectionTitle>{t("displaySectionTitle")}</SectionTitle>
              <DisplaySettingsSection />
            </section>

            <section className="space-y-4">
              <SectionTitle>{t("privacySectionTitle")}</SectionTitle>
              <PrivacySettingsSection />
            </section>
          </div>
        </MembersOnlyGate>
      </div>
    </ContentContainer>
  );
}
