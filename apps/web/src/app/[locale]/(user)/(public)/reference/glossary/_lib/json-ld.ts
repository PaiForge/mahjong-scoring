import { SITE_URL } from "@/config";
import { localizedHref } from "@/i18n/public-path";

import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import type { GlossaryTermView } from "@mahjong-scoring/features/glossary/views";
import { GLOSSARY_PATH } from "@mahjong-scoring/features/glossary/routes";

/** ロケール非依存のパスを、その言語のページの絶対 URL にする */
function absoluteUrl(path: string, locale: SupportedLocale): string {
  return `${SITE_URL}${localizedHref(path, locale)}`;
}

/**
 * 用語集の JSON-LD（DefinedTermSet）を組み立てる。
 * 用語集の構造化データ
 *
 * 用語集は schema.org に専用の型がある数少ないページで、一覧を
 * DefinedTermSet、各語を DefinedTerm として出すと検索側が語の集合として
 * 扱える。パンくずの BreadcrumbList（Breadcrumb コンポーネントが出す）とは
 * 別物なので、両方を出して構わない。
 *
 * 言語（`locale`、省略時は日本語）はページの本文の言語に合わせる。URL は
 * その言語のページ（英語は `/en/reference/glossary/...`）で、DefinedTerm は
 * 言語ページごとに別のエンティティになる。名前・説明は呼び出し側が渡す
 * その言語の本文で、`inLanguage` もその言語にする。
 *
 * @param params.name 一覧の名前（辞書の `glossary.title`）
 * @param params.description 一覧の説明
 * @param params.terms 収録している用語（`href` はロケール非依存のパス）
 * @param params.locale ページの言語（省略時は日本語）
 */
export function buildDefinedTermSetSchema({
  name,
  description,
  terms,
  locale = DEFAULT_LOCALE,
}: {
  readonly name: string;
  readonly description: string;
  readonly terms: readonly GlossaryTermView[];
  readonly locale?: SupportedLocale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name,
    description,
    url: absoluteUrl(GLOSSARY_PATH, locale),
    inLanguage: locale,
    hasDefinedTerm: terms.map((term) => ({
      "@type": "DefinedTerm",
      name: term.term,
      description: term.definition,
      url: absoluteUrl(term.href, locale),
    })),
  };
}

/**
 * 用語 1 件の JSON-LD（DefinedTerm）を組み立てる。
 * 用語の構造化データ
 *
 * @param params.term 対象の用語
 * @param params.termSetName 所属する用語集の名前
 * @param params.locale ページの言語（省略時は日本語）
 */
export function buildDefinedTermSchema({
  term,
  termSetName,
  locale = DEFAULT_LOCALE,
}: {
  readonly term: GlossaryTermView;
  readonly termSetName: string;
  readonly locale?: SupportedLocale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.definition,
    url: absoluteUrl(term.href, locale),
    inLanguage: locale,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: termSetName,
      url: absoluteUrl(GLOSSARY_PATH, locale),
    },
  };
}
