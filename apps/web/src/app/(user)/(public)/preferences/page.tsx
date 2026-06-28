/**
 * 設定（環境設定）
 *
 * @description 端末ローカルに保存される麻雀ルールの差分設定など、ログイン不要の設定を集約するページ。
 * @flow ヘッダーのメニュー / アカウントメニュー → 設定
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { MembersOnlyGate } from "./_components/members-only-gate";
import { RuleSettingsSection } from "./_components/rule-settings-section";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return createMetadata({ title: t("pageTitle") });
}

export default async function PreferencesPage() {
  const t = await getTranslations("settings");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <MembersOnlyGate>
          <section className="space-y-4">
            <SectionTitle>{t("rulesSectionTitle")}</SectionTitle>
            <RuleSettingsSection />
          </section>
        </MembersOnlyGate>
      </div>
    </ContentContainer>
  );
}
