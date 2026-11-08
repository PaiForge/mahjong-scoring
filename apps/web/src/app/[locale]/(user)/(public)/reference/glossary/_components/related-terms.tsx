import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import type { GlossaryTermView } from "@mahjong-scoring/features/glossary/views";

import { LocalizedTextLink } from "./localized-text-link";

interface RelatedTermsProps {
  readonly terms: readonly GlossaryTermView[];
  /** ページの言語（用語ページへのリンクの言語） */
  readonly locale: SupportedLocale;
}

/**
 * 関連する用語のリンク
 * 関連語リンク
 *
 * 用語は 1 語だけでは分からないことが多い（「暗刻」は「刻子」と「明刻」を
 * 知って初めて意味を持つ）。隣り合う語へ 1 クリックで移れるようにする。
 */
export function RelatedTerms({ terms, locale }: RelatedTermsProps) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {terms.map((term) => (
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
  );
}
