import { getTranslations } from "next-intl/server";

import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import type { NativeAdView } from "@/lib/ads/creatives";
import { KANA_ROWS, kanaAnchorId } from "@/lib/glossary/kana";
import type { GlossaryTermView } from "@/lib/glossary/queries";

interface KanaTermListProps {
  readonly terms: readonly GlossaryTermView[];
  /** 最初の行の末尾に混ぜる広告。掲載中の広告が無ければ undefined */
  readonly ad?: NativeAdView;
}

/**
 * 五十音順の用語一覧
 * 五十音一覧
 *
 * 行ごとに見出しを立て、その中は読み順に並べる。行の中に置くのは語と読み
 * だけ — 意味は用語ページに置き、一覧はどこに何があるかを見せる役に徹する。
 *
 * ネイティブ広告は語のある最初の行（ふつうは「あ行」）の末尾に 1 行だけ置く。
 */
export async function KanaTermList({ terms, ad }: KanaTermListProps) {
  const t = await getTranslations("glossary");
  const firstRow = KANA_ROWS.find((row) =>
    terms.some((term) => term.kanaRow === row),
  );

  return (
    <div className="space-y-6">
      {KANA_ROWS.map((row) => {
        const inRow = terms.filter((term) => term.kanaRow === row);
        if (inRow.length === 0) return undefined;
        const isFirstRow = row === firstRow;

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
              {isFirstRow && ad && <NativeAdRow creative={ad} />}
            </LinkRowList>
          </section>
        );
      })}
    </div>
  );
}
