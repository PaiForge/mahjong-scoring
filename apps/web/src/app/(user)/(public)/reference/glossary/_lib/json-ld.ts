import { SITE_URL } from "@/config";

import type { GlossaryTermView } from "@/lib/glossary/queries";
import { GLOSSARY_PATH } from "@/lib/glossary/routes";

/**
 * 用語集の JSON-LD（DefinedTermSet）を組み立てる。
 * 用語集の構造化データ
 *
 * 用語集は schema.org に専用の型がある数少ないページで、一覧を
 * DefinedTermSet、各語を DefinedTerm として出すと検索側が語の集合として
 * 扱える。パンくずの BreadcrumbList（Breadcrumb コンポーネントが出す）とは
 * 別物なので、両方を出して構わない。
 *
 * @param params.name 一覧の名前（辞書の `glossary.title`）
 * @param params.description 一覧の説明
 * @param params.terms 収録している用語
 */
export function buildDefinedTermSetSchema({
  name,
  description,
  terms,
}: {
  readonly name: string;
  readonly description: string;
  readonly terms: readonly GlossaryTermView[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name,
    description,
    url: `${SITE_URL}${GLOSSARY_PATH}`,
    inLanguage: "ja",
    hasDefinedTerm: terms.map((term) => ({
      "@type": "DefinedTerm",
      name: term.term,
      description: term.definition,
      url: `${SITE_URL}${term.href}`,
    })),
  };
}

/**
 * 用語 1 件の JSON-LD（DefinedTerm）を組み立てる。
 * 用語の構造化データ
 *
 * @param params.term 対象の用語
 * @param params.termSetName 所属する用語集の名前
 */
export function buildDefinedTermSchema({
  term,
  termSetName,
}: {
  readonly term: GlossaryTermView;
  readonly termSetName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.definition,
    url: `${SITE_URL}${term.href}`,
    inLanguage: "ja",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: termSetName,
      url: `${SITE_URL}${GLOSSARY_PATH}`,
    },
  };
}
