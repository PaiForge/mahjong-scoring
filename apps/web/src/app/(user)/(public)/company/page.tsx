/**
 * 運営者情報
 *
 * @description
 * 本サービスを提供する事業者の名称・所在地・事業内容。利用規約と
 * プライバシーポリシーが「運営者」と呼ぶ主体の実体で、内容は
 * blindfold-chess の同ページと同じ（同じ事業者が運営しているため）。
 * 事業者の情報を変えるときは両方のサイトで揃えること。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";

import {
  LegalArticle,
  LegalLink,
  LegalList,
  LegalParagraph,
  LegalSection,
} from "../_components/legal-article";

/** 事業者のコーポレートサイト */
const CORPORATE_SITE_URL = "https://www.fuji.llc/";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("company", {
    title: "pageTitle",
    path: "/company",
  });
}

export default async function CompanyPage() {
  const t = await getTranslations("company");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <LegalArticle>
        <LegalSection title={t("name.title")}>
          <LegalParagraph>{t("name.value")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("location.title")}>
          <LegalParagraph>{t("location.value")}</LegalParagraph>
        </LegalSection>

        <LegalSection title={t("business.title")}>
          <LegalList>
            <li>{t("business.item1")}</li>
            <li>{t("business.item2")}</li>
            <li>{t("business.item3")}</li>
            <li>{t("business.item4")}</li>
          </LegalList>
        </LegalSection>

        <LegalParagraph>
          {t.rich("moreInfo", {
            link: (chunks) => (
              <LegalLink href={CORPORATE_SITE_URL} external>
                {chunks}
              </LegalLink>
            ),
          })}
        </LegalParagraph>
      </LegalArticle>
    </ContentContainer>
  );
}
