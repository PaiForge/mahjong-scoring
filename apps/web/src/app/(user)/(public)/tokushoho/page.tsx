/**
 * 特定商取引法に基づく表記
 *
 * @description
 * 有料プラン（Pro）を販売するために特定商取引法が求める表示。本文はすべて
 * 辞書（`tokushoho` 名前空間）にあり、このファイルは項目の並びと文中リンクの
 * 張り先だけを持つ。事業者名と所在地は `company` の表示と一致させること。
 * 価格は料金ページ（`/plan`）が Stripe から読んで出すので、ここには書かない。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";

import {
  LegalArticle,
  LegalLink,
  LegalParagraph,
  LegalSection,
} from "../_components/legal-article";

/** 項目の並び。辞書のキーと一致させる */
const PLAIN_SECTIONS = [
  "seller",
  "representative",
  "address",
  "phone",
] as const;

const TRADE_SECTIONS = [
  "extraFees",
  "paymentMethod",
  "paymentTiming",
  "delivery",
  "returns",
  "environment",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("tokushoho", {
    title: "pageTitle",
    path: "/tokushoho",
  });
}

export default async function TokushohoPage() {
  const t = await getTranslations("tokushoho");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <LegalArticle>
        {PLAIN_SECTIONS.map((key) => (
          <LegalSection key={key} title={t(`${key}.title`)}>
            <LegalParagraph>{t(`${key}.value`)}</LegalParagraph>
          </LegalSection>
        ))}

        <LegalSection title={t("contact.title")}>
          <LegalParagraph>
            {t.rich("contact.value", {
              contact: (chunks) => (
                <LegalLink href="/contact">{chunks}</LegalLink>
              ),
            })}
          </LegalParagraph>
        </LegalSection>

        <LegalSection title={t("price.title")}>
          <LegalParagraph>
            {t.rich("price.value", {
              plan: (chunks) => <LegalLink href="/plan">{chunks}</LegalLink>,
            })}
          </LegalParagraph>
        </LegalSection>

        {TRADE_SECTIONS.map((key) => (
          <LegalSection key={key} title={t(`${key}.title`)}>
            <LegalParagraph>{t(`${key}.value`)}</LegalParagraph>
          </LegalSection>
        ))}
      </LegalArticle>
    </ContentContainer>
  );
}
