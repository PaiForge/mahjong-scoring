import Link from "next/link";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { GlossaryTermView } from "@/lib/glossary/queries";

interface RelatedTermsProps {
  readonly terms: readonly GlossaryTermView[];
}

/**
 * 関連する用語のリンク
 * 関連語リンク
 *
 * 用語は 1 語だけでは分からないことが多い（「暗刻」は「刻子」と「明刻」を
 * 知って初めて意味を持つ）。隣り合う語へ 1 クリックで移れるようにする。
 */
export function RelatedTerms({ terms }: RelatedTermsProps) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {terms.map((term) => (
        <li key={term.slug}>
          <Link href={term.href} className={`text-sm ${TEXT_LINK_CLASSES}`}>
            {term.term}
          </Link>
        </li>
      ))}
    </ul>
  );
}
