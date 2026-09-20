/**
 * プライバシーポリシー
 *
 * @description
 * 本文はすべて辞書（`privacy` 名前空間）にあり、このファイルは節の並びと
 * 文中リンクの張り先だけを持つ。「収集する情報」「端末に保存する設定」
 * 「第三者への提供（委託先）」「保持期間」はサービスの実装をそのまま
 * 書いているので、保存する項目・使う外部サービス・退会時の処理を変えたら
 * 文面も合わせて直すこと。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata, SITE_NAME } from "@/app/_lib/metadata";

import {
  LegalArticle,
  LegalLastUpdated,
  LegalLink,
  LegalList,
  LegalParagraph,
  LegalSection,
} from "../_components/legal-article";

/** 改定日。文面を変えたら更新する */
const LAST_UPDATED = "2026-09-14";

/** 文中から参照する Google の各ポリシー・設定ページ */
const GOOGLE_LINKS = {
  privacyPolicy: "https://policies.google.com/privacy",
  adsSettings: "https://adssettings.google.com/",
  partnerSites: "https://policies.google.com/technologies/partner-sites",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("privacy", {
    title: "pageTitle",
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <LegalArticle>
        <LegalParagraph>{t("intro", { siteName: SITE_NAME })}</LegalParagraph>

        <LegalSection title={t("collected.title")}>
          <LegalParagraph>{t("collected.body")}</LegalParagraph>
          <LegalList>
            <li>{t("collected.account")}</li>
            <li>{t("collected.profile")}</li>
            <li>{t("collected.records")}</li>
            <li>{t("collected.activity")}</li>
            <li>{t("collected.access")}</li>
            <li>{t("collected.inquiry")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("purpose.title")}>
          <LegalParagraph>{t("purpose.body")}</LegalParagraph>
          <LegalList>
            <li>{t("purpose.item1")}</li>
            <li>{t("purpose.item2")}</li>
            <li>{t("purpose.item3")}</li>
            <li>{t("purpose.item4")}</li>
            <li>{t("purpose.item5")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("cookies.title")}>
          <LegalParagraph>{t("cookies.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("analytics.title")}>
          <LegalParagraph>{t("analytics.body")}</LegalParagraph>
          <LegalList>
            <li>{t("analytics.item1")}</li>
            <li>{t("analytics.item2")}</li>
            <li>{t("analytics.item3")}</li>
          </LegalList>
          <LegalParagraph>
            {t.rich("analytics.note", {
              link: (chunks) => (
                <LegalLink href={GOOGLE_LINKS.privacyPolicy} external>
                  {chunks}
                </LegalLink>
              ),
            })}
          </LegalParagraph>
        </LegalSection>

        <LegalSection title={t("ads.title")}>
          <LegalParagraph>{t("ads.body")}</LegalParagraph>
          <LegalList>
            <li>{t("ads.item1")}</li>
            <li>{t("ads.item2")}</li>
            <li>{t("ads.item3")}</li>
          </LegalList>
          <LegalParagraph>
            {t.rich("ads.optOut", {
              link: (chunks) => (
                <LegalLink href={GOOGLE_LINKS.adsSettings} external>
                  {chunks}
                </LegalLink>
              ),
            })}
          </LegalParagraph>
          <LegalParagraph>
            {t.rich("ads.learnMore", {
              link: (chunks) => (
                <LegalLink href={GOOGLE_LINKS.partnerSites} external>
                  {chunks}
                </LegalLink>
              ),
            })}
          </LegalParagraph>
        </LegalSection>

        <LegalSection title={t("localStorage.title")}>
          <LegalParagraph>{t("localStorage.body")}</LegalParagraph>
          <LegalList>
            <li>{t("localStorage.item1")}</li>
            <li>{t("localStorage.item2")}</li>
            <li>{t("localStorage.item3")}</li>
          </LegalList>
          <LegalParagraph>{t("localStorage.note")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("publicInfo.title")}>
          <LegalParagraph>
            {t.rich("publicInfo.body", {
              preferences: (chunks) => (
                <LegalLink href="/preferences">{chunks}</LegalLink>
              ),
            })}
          </LegalParagraph>
        </LegalSection>

        <LegalSection title={t("thirdParty.title")}>
          <LegalParagraph>{t("thirdParty.body")}</LegalParagraph>
          <LegalList>
            <li>{t("thirdParty.item1")}</li>
            <li>{t("thirdParty.item2")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("externalLinks.title")}>
          <LegalParagraph>{t("externalLinks.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("children.title")}>
          <LegalParagraph>{t("children.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("rights.title")}>
          <LegalParagraph>{t("rights.body")}</LegalParagraph>
          <LegalList>
            <li>
              {t.rich("rights.item1", {
                profile: (chunks) => (
                  <LegalLink href="/mypage/profile/edit">{chunks}</LegalLink>
                ),
              })}
            </li>
            <li>
              {t.rich("rights.item2", {
                deleteAccount: (chunks) => (
                  <LegalLink href="/mypage/account/delete">{chunks}</LegalLink>
                ),
              })}
            </li>
            <li>
              {t.rich("rights.item3", {
                link: (chunks) => (
                  <LegalLink href={GOOGLE_LINKS.adsSettings} external>
                    {chunks}
                  </LegalLink>
                ),
              })}
            </li>
            <li>
              {t.rich("rights.item4", {
                contact: (chunks) => (
                  <LegalLink href="/contact">{chunks}</LegalLink>
                ),
              })}
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("retention.title")}>
          <LegalParagraph>{t("retention.body")}</LegalParagraph>
          <LegalList>
            <li>{t("retention.item1")}</li>
            <li>{t("retention.item2")}</li>
            <li>{t("retention.item3")}</li>
            <li>{t("retention.item4")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("revision.title")}>
          <LegalParagraph>{t("revision.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("contact.title")}>
          <LegalParagraph>
            {t.rich("contact.body", {
              contact: (chunks) => (
                <LegalLink href="/contact">{chunks}</LegalLink>
              ),
            })}
          </LegalParagraph>
        </LegalSection>

        <LegalLastUpdated date={LAST_UPDATED} />
      </LegalArticle>
    </ContentContainer>
  );
}
