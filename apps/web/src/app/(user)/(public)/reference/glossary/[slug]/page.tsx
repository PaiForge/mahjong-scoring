/**
 * 用語ページ
 *
 * @description
 * 用語 1 語の意味と、形が要る語には手牌の例を示す。関連語と、その語を扱う
 * 教本の章へ送る導線を持つ。文言は辞書（`glossary.terms.<slug>`）、構造は
 * 用語レジストリ（`lib/glossary/registry.ts`）が持つ。
 *
 * 全 slug を `generateStaticParams` で列挙して静的生成する。レジストリに
 * 無い slug は 404。
 *
 * @flow
 * 用語集（/reference/glossary）の一覧、教本本文の用語リンクから開いた
 * モーダルの「用語ページを見る」、他の用語ページの関連語から遷移する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createMetadata } from "@/app/_lib/metadata";
import {
  getGlossaryTermViewBySlug,
  getGlossaryTermViews,
} from "@/lib/glossary/queries";
import { GLOSSARY_TERM_SLUGS } from "@/lib/glossary/registry";
import { GLOSSARY_PATH } from "@/lib/glossary/routes";

import { JsonLd } from "../_components/json-ld";
import { RelatedTerms } from "../_components/related-terms";
import { TermExamples } from "../_components/term-examples";
import { TermLearnLinks } from "../_components/term-learn-links";
import { buildDefinedTermSchema } from "../_lib/json-ld";

interface GlossaryTermPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return GLOSSARY_TERM_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GlossaryTermPageProps): Promise<Metadata> {
  const { slug } = await params;
  const term = await getGlossaryTermViewBySlug(slug);
  if (!term) return {};

  return createMetadata({
    title: term.term,
    description: term.definition,
    path: term.href,
  });
}

export default async function GlossaryTermPage({
  params,
}: GlossaryTermPageProps) {
  const { slug } = await params;
  const [term, t, tHub] = await Promise.all([
    getGlossaryTermViewBySlug(slug),
    getTranslations("glossary"),
    getTranslations("reference"),
  ]);
  if (!term) notFound();

  // 関連語は「あるものだけ」を出す。辞書に無い slug は queries が落とすため、
  // ここに来る時点で表示できる語だけが残っている。
  const allTerms = await getGlossaryTermViews();
  const related = (term.related ?? [])
    .map((relatedSlug) => allTerms.find((t2) => t2.slug === relatedSlug))
    .filter((t2) => t2 !== undefined);
  const learnSlugs = term.learnSlugs ?? [];

  return (
    <>
      <JsonLd
        data={buildDefinedTermSchema({ term, termSetName: t("title") })}
      />
      <ContentContainer
        breadcrumb={[
          { label: tHub("title"), href: "/reference" },
          { label: t("title"), href: GLOSSARY_PATH },
          { label: term.term },
        ]}
      >
        <PageTitle>{term.term}</PageTitle>

        <div className="space-y-10">
          <section className="space-y-4">
            <SectionTitle>{t("definitionTitle")}</SectionTitle>
            <p className="text-sm text-surface-400">
              {t("readingLabel")}: {term.reading}
            </p>
            <p className="text-sm leading-relaxed text-surface-700">
              {term.definition}
            </p>
          </section>

          {term.examples !== undefined && term.examples.length > 0 && (
            <section className="space-y-4">
              <SectionTitle>{t("examplesTitle")}</SectionTitle>
              <TermExamples examples={term.examples} />
            </section>
          )}

          {related.length > 0 && (
            <section className="space-y-4">
              <SectionTitle>{t("relatedTitle")}</SectionTitle>
              <RelatedTerms terms={related} />
            </section>
          )}

          {learnSlugs.length > 0 && (
            <section className="space-y-4">
              <SectionTitle>{t("learnTitle")}</SectionTitle>
              <TermLearnLinks slugs={learnSlugs} />
            </section>
          )}

          <Link href={GLOSSARY_PATH} className={`text-sm ${TEXT_LINK_CLASSES}`}>
            {t("backToIndex")}
          </Link>
        </div>
      </ContentContainer>
    </>
  );
}
