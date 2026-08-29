import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { GlossaryTermView } from "@/lib/glossary/queries";
import { GLOSSARY_CATEGORIES } from "@/lib/glossary/types";

interface CategoryTermIndexProps {
  readonly terms: readonly GlossaryTermView[];
}

/**
 * 分類ごとの用語インデックス
 * 分類インデックス
 *
 * 「符とは何か」を調べたい読者は語を知っているが、「符のあたりの言葉を
 * ひととおり見たい」読者は語を知らない。後者のために、意味の近いものを
 * まとめて並べる。定義は置かず、語だけを詰めて一覧性を優先する。
 */
export async function CategoryTermIndex({ terms }: CategoryTermIndexProps) {
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
                  <Link
                    href={term.href}
                    className={`text-sm ${TEXT_LINK_CLASSES}`}
                  >
                    {term.term}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
