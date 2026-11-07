import { getTranslations } from "next-intl/server";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import type { GlossaryTermView } from "@mahjong-scoring/features/glossary/views";
import { GLOSSARY_CATEGORIES } from "@mahjong-scoring/features/glossary/types";

import { LocalizedTextLink } from "./localized-text-link";

interface CategoryTermIndexProps {
  readonly terms: readonly GlossaryTermView[];
  /** ページの言語（用語ページへのリンクの言語） */
  readonly locale: SupportedLocale;
}

/**
 * 分類ごとの用語インデックス
 * 分類インデックス
 *
 * 「符とは何か」を調べたい読者は語を知っているが、「符のあたりの言葉を
 * ひととおり見たい」読者は語を知らない。後者のために、意味の近いものを
 * まとめて並べる。定義は置かず、語だけを詰めて一覧性を優先する。
 *
 * 分類の並びは言語に依らず `GLOSSARY_CATEGORIES`（初学者が読む順）のまま。
 * 分類の中の語は `terms` の並び（その言語の索引の順）に従う。
 */
export async function CategoryTermIndex({
  terms,
  locale,
}: CategoryTermIndexProps) {
  const t = await getTranslations("glossary");

  return (
    <div className="space-y-5">
      {GLOSSARY_CATEGORIES.map((category) => {
        const inCategory = terms.filter((term) => term.category === category);
        if (inCategory.length === 0) return undefined;

        return (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-bold text-surface-900">
              {t(`categories.${category}`)}
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {inCategory.map((term) => (
                <li key={term.slug}>
                  <LocalizedTextLink
                    path={term.href}
                    locale={locale}
                    className="text-sm"
                  >
                    {term.term}
                  </LocalizedTextLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
