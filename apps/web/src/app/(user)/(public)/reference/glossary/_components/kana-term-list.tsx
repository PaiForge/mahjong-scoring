import { getTranslations } from "next-intl/server";

import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { KANA_ROWS, kanaAnchorId } from "@/lib/glossary/kana";
import type { GlossaryTermView } from "@/lib/glossary/queries";

interface KanaTermListProps {
  readonly terms: readonly GlossaryTermView[];
}

/**
 * 五十音順の用語一覧
 * 五十音一覧
 *
 * 行ごとに見出しを立て、その中は読み順に並べる。行の中に置くのは語と読み
 * だけ — 意味は用語ページに置き、一覧はどこに何があるかを見せる役に徹する。
 */
export async function KanaTermList({ terms }: KanaTermListProps) {
  const t = await getTranslations("glossary");

  return (
    <div className="space-y-6">
      {KANA_ROWS.map((row) => {
        const inRow = terms.filter((term) => term.kanaRow === row);
        if (inRow.length === 0) return undefined;

        return (
          <section key={row} className="space-y-1">
            {/* ヘッダに隠れないよう、行見出しの上に余白を取ってからスクロールする */}
            <h3
              id={kanaAnchorId(row)}
              className="scroll-mt-24 text-sm font-bold text-surface-900"
            >
              {t("kanaRowHeading", { row })}
            </h3>
            <LinkRowList>
              {inRow.map((term) => (
                <LinkRow
                  key={term.slug}
                  href={term.href}
                  title={term.term}
                  description={term.reading}
                />
              ))}
            </LinkRowList>
          </section>
        );
      })}
    </div>
  );
}
