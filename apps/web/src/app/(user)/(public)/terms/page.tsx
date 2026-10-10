/**
 * 利用規約
 *
 * @description
 * 本文はすべて辞書（`terms` 名前空間）にあり、このファイルは節の並びと
 * 文中リンクの張り先だけを持つ。文面はサービスの実装（未ログイン時に
 * 記録が残らないこと、退会時に消すもの・残すもの、公開される項目）を
 * そのまま書いているので、実装を変えたら文面も合わせて直すこと。
 * 特に「退会」の節は `lib/users/delete-account.ts` と、「有料プラン」の節は
 * `lib/billing/plans.ts`（期間パスの重ね買い・買い切りの範囲）と対応している。
 * 「通報とブロック」の節の「24 時間以内に確認する」は運営の約束で、通報が
 * 届くと運営者へメールで知らせる仕組みがそれを支えている。App Store の審査
 * （ガイドライン 1.2: 利用者の投稿を載せるアプリは、不適切な内容を容認しない
 * 旨の規約・通報と迅速な対応・ブロック・連絡先を備えること）が求める文面でもある。
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
const LAST_UPDATED = "2026-10-10";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("terms", {
    title: "pageTitle",
    path: "/terms",
  });
}

export default async function TermsPage() {
  const t = await getTranslations("terms");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <LegalArticle>
        <LegalSection title={t("acceptance.title")}>
          <LegalParagraph>
            {t.rich("acceptance.body", {
              siteName: SITE_NAME,
              company: (chunks) => (
                <LegalLink href="/company">{chunks}</LegalLink>
              ),
            })}
          </LegalParagraph>
        </LegalSection>

        <LegalSection title={t("service.title")}>
          <LegalParagraph>{t("service.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("account.title")}>
          <LegalParagraph>{t("account.body")}</LegalParagraph>
          <LegalList>
            <li>{t("account.item1")}</li>
            <li>{t("account.item2")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("data.title")}>
          <LegalParagraph>
            <strong className="font-semibold text-foreground">
              {t("data.warning")}
            </strong>
          </LegalParagraph>
          <LegalParagraph>{t("data.guest")}</LegalParagraph>
          <LegalParagraph>{t("data.member")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("publicInfo.title")}>
          <LegalParagraph>{t("publicInfo.body")}</LegalParagraph>
          <LegalList>
            <li>{t("publicInfo.item1")}</li>
            <li>{t("publicInfo.item2")}</li>
            <li>{t("publicInfo.item3")}</li>
          </LegalList>
          <LegalParagraph>
            {t.rich("publicInfo.note", {
              preferences: (chunks) => (
                <LegalLink href="/preferences">{chunks}</LegalLink>
              ),
            })}
          </LegalParagraph>
        </LegalSection>

        <LegalSection title={t("deletion.title")}>
          <LegalParagraph>{t("deletion.body")}</LegalParagraph>
          <LegalList>
            <li>{t("deletion.item1")}</li>
            <li>{t("deletion.item2")}</li>
            <li>{t("deletion.item3")}</li>
            <li>{t("deletion.item4")}</li>
            <li>{t("deletion.item5")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("paidPlan.title")}>
          <LegalParagraph>{t("paidPlan.body")}</LegalParagraph>
          <LegalList>
            <li>{t("paidPlan.item1")}</li>
            <li>{t("paidPlan.item2")}</li>
            <li>{t("paidPlan.item3")}</li>
            <li>{t("paidPlan.item4")}</li>
            <li>{t("paidPlan.item5")}</li>
            <li>{t("paidPlan.item6")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("responsibilities.title")}>
          <LegalParagraph>{t("responsibilities.body")}</LegalParagraph>
          <LegalList>
            <li>{t("responsibilities.item1")}</li>
            <li>{t("responsibilities.item2")}</li>
            <li>{t("responsibilities.item3")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("prohibited.title")}>
          <LegalParagraph>{t("prohibited.body")}</LegalParagraph>
          <LegalList>
            <li>{t("prohibited.item1")}</li>
            <li>{t("prohibited.item2")}</li>
            <li>{t("prohibited.item3")}</li>
            <li>{t("prohibited.item4")}</li>
            <li>{t("prohibited.item5")}</li>
            <li>{t("prohibited.item6")}</li>
            <li>{t("prohibited.item7")}</li>
            <li>{t("prohibited.item8")}</li>
            <li>{t("prohibited.item9")}</li>
            <li>{t("prohibited.item10")}</li>
          </LegalList>
          <LegalParagraph>{t("prohibited.note")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("reporting.title")}>
          <LegalParagraph>{t("reporting.body")}</LegalParagraph>
          <LegalList>
            <li>{t("reporting.item1")}</li>
            <li>{t("reporting.item2")}</li>
            <li>{t("reporting.item3")}</li>
            <li>
              {t.rich("reporting.item4", {
                contact: (chunks) => (
                  <LegalLink href="/contact">{chunks}</LegalLink>
                ),
              })}
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("intellectualProperty.title")}>
          <LegalParagraph>{t("intellectualProperty.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("disclaimer.title")}>
          <LegalParagraph>{t("disclaimer.accuracy")}</LegalParagraph>
          <LegalParagraph>{t("disclaimer.body")}</LegalParagraph>
          <LegalList>
            <li>{t("disclaimer.item1")}</li>
            <li>{t("disclaimer.item2")}</li>
            <li>{t("disclaimer.item3")}</li>
          </LegalList>
        </LegalSection>

        <LegalSection title={t("liability.title")}>
          <LegalParagraph>{t("liability.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("serviceChanges.title")}>
          <LegalParagraph>{t("serviceChanges.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("suspension.title")}>
          <LegalParagraph>{t("suspension.body")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("governingLaw.title")}>
          <LegalParagraph>{t("governingLaw.body")}</LegalParagraph>
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
