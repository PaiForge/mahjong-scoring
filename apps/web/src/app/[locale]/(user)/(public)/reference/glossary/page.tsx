/**
 * 用語集
 *
 * @description
 * 点数計算に出てくる麻雀の専門用語を引くための一覧。分類（意味の近さ）と
 * 五十音の 2 つの入口を持ち、語そのものの説明は用語ページ
 * （/reference/glossary/[slug]）に置く。教本本文の用語リンクから開く
 * モーダルも同じ辞書を読む。
 *
 * 索引は言語ごとの行で引く（日本語は読みの五十音、英語は見出し語の頭文字
 * A〜Z。`features/glossary/index-rows.ts`）。並び・metadata・JSON-LD・広告・
 * 用語ページへのリンクは、入口で `prepareRouteLocale` が確定させた言語を渡して
 * 組む（`headers()` / `cookies()` を読まず静的生成のまま）。
 *
 * @flow
 * 早見表ハブ（/reference）か教本本文の用語リンクから来て、分類か索引で
 * 目的の語を探し、用語ページへ遷移する。一覧の下の「ほかの早見表」から
 * 点数表・役一覧へ。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getNativeAdPlacements } from "@/lib/ads/creatives";
import { getGlossaryTermViews } from "@/lib/glossary/queries";

import { RelatedReferencesSection } from "../_components/related-references-section";
import { CategoryTermIndex } from "./_components/category-term-index";
import { JsonLd } from "@/app/[locale]/(user)/_components/json-ld";
import { KanaRowNav } from "./_components/kana-row-nav";
import { KanaTermList } from "./_components/kana-term-list";
import { buildDefinedTermSetSchema } from "./_lib/json-ld";
import { REFERENCE_PATH } from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reference/glossary">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/reference/glossary");
  // canonical はリテラルで渡す（seo-coverage.test.ts がページのソースを
  // 読んで「自分のパスと一致する canonical か」を検査するため）。
  // sitemap 側は GLOSSARY_PATH から組み立てるので、両者がずれるとテストが落ちる。
  return createNamespaceMetadata("glossary", {
    path: "/reference/glossary",
    locale,
  });
}

export default async function GlossaryIndexPage({
  params,
}: PageProps<"/[locale]/reference/glossary">) {
  const locale = await prepareRouteLocale(params, "/reference/glossary");
  const [t, tHub, terms, ads] = await Promise.all([
    getTranslations("glossary"),
    getTranslations("reference"),
    getGlossaryTermViews(locale),
    getNativeAdPlacements("glossary-index-native-ad", locale),
  ]);

  return (
    <>
      <JsonLd
        data={buildDefinedTermSetSchema({
          name: t("title"),
          description: t("description"),
          terms,
          locale,
        })}
      />
      <ContentContainer
        breadcrumb={[
          { label: tHub("title"), href: REFERENCE_PATH },
          { label: t("title") },
        ]}
      >
        <PageTitle>{t("title")}</PageTitle>

        <div className="space-y-10">
          <section className="space-y-4">
            <SectionTitle>{t("categoryIndexTitle")}</SectionTitle>
            <CategoryTermIndex terms={terms} locale={locale} />
          </section>

          <section className="space-y-4">
            <SectionTitle>{t("kanaIndexTitle")}</SectionTitle>
            <KanaRowNav terms={terms} locale={locale} />
            <KanaTermList terms={terms} ads={ads} locale={locale} />
          </section>

          <RelatedReferencesSection current="glossary" />
        </div>
      </ContentContainer>
    </>
  );
}
