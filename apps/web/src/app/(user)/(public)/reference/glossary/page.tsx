/**
 * 用語集
 *
 * @description
 * 点数計算に出てくる麻雀の専門用語を引くための一覧。分類（意味の近さ）と
 * 五十音の 2 つの入口を持ち、語そのものの説明は用語ページ
 * （/reference/glossary/[slug]）に置く。教本本文の用語リンクから開く
 * モーダルも同じ辞書を読む。
 *
 * @flow
 * 早見表ハブ（/reference）か教本本文の用語リンクから来て、分類か五十音で
 * 目的の語を探し、用語ページへ遷移する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getGlossaryTermViews } from "@/lib/glossary/queries";

import { CategoryTermIndex } from "./_components/category-term-index";
import { JsonLd } from "./_components/json-ld";
import { KanaRowNav } from "./_components/kana-row-nav";
import { KanaTermList } from "./_components/kana-term-list";
import { buildDefinedTermSetSchema } from "./_lib/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  // canonical はリテラルで渡す（seo-coverage.test.ts がページのソースを
  // 読んで「自分のパスと一致する canonical か」を検査するため）。
  // sitemap 側は GLOSSARY_PATH から組み立てるので、両者がずれるとテストが落ちる。
  return createNamespaceMetadata("glossary", { path: "/reference/glossary" });
}

export default async function GlossaryIndexPage() {
  const [t, tHub, terms] = await Promise.all([
    getTranslations("glossary"),
    getTranslations("reference"),
    getGlossaryTermViews(),
  ]);

  return (
    <>
      <JsonLd
        data={buildDefinedTermSetSchema({
          name: t("title"),
          description: t("description"),
          terms,
        })}
      />
      <ContentContainer
        breadcrumb={[
          { label: tHub("title"), href: "/reference" },
          { label: t("title") },
        ]}
      >
        <PageTitle>{t("title")}</PageTitle>

        <div className="space-y-10">
          <p className="text-sm leading-relaxed text-surface-700">
            {t("lead")}
          </p>

          <section className="space-y-4">
            <SectionTitle>{t("categoryIndexTitle")}</SectionTitle>
            <CategoryTermIndex terms={terms} />
          </section>

          <section className="space-y-4">
            <SectionTitle>{t("kanaIndexTitle")}</SectionTitle>
            <KanaRowNav terms={terms} />
            <KanaTermList terms={terms} />
          </section>
        </div>
      </ContentContainer>
    </>
  );
}
