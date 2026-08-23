/**
 * 設定（環境設定）
 *
 * @description 麻雀ルールの差分設定（端末ローカル）とプライバシー設定
 * （アカウントに紐づく）を集約するページ。
 * @flow ヘッダーのメニュー / アカウントメニュー → 設定
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createTitleOnlyMetadata } from "@/app/_lib/metadata";
import { MembersOnlyGate } from "./_components/members-only-gate";
import { PrivacySettingsSection } from "./_components/privacy-settings-section";
import { RuleSettingsSection } from "./_components/rule-settings-section";

export async function generateMetadata(): Promise<Metadata> {
  return createTitleOnlyMetadata("settings", "pageTitle");
}

export default async function PreferencesPage() {
  const t = await getTranslations("settings");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <MembersOnlyGate>
          <div className="space-y-8">
            <section className="space-y-4">
              <SectionTitle>{t("rulesSectionTitle")}</SectionTitle>
              <RuleSettingsSection />
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
