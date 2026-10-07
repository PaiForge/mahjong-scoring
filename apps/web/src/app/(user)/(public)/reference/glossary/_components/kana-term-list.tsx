import { getTranslations } from "next-intl/server";

import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";
import { adIndexAfterGroup } from "@/lib/ads/spacing";
import {
  KANA_ROWS,
  kanaAnchorId,
} from "@mahjong-scoring/features/glossary/kana";
import type { GlossaryTermView } from "@mahjong-scoring/features/glossary/views";

interface KanaTermListProps {
  readonly terms: readonly GlossaryTermView[];
  /** 行の末尾に混ぜる広告（並び順どおり）。掲載中が無ければ空 */
  readonly ads: readonly NativeAdView[];
}

/**
 * 五十音順の用語一覧
 * 五十音一覧
 *
 * 行ごとに見出しを立て、その中は読み順に並べる。行の中に置くのは語と読み
 * だけ — 意味は用語ページに置き、一覧はどこに何があるかを見せる役に徹する。
 *
 * ネイティブ広告は語のある行の末尾に 1 行ずつ、間隔を広げながら置く
 * （`adIndexAfterGroup`）。語の無い行は描かないので、間隔にも数えない。
 */
export async function KanaTermList({ terms, ads }: KanaTermListProps) {
  const t = await getTranslations("glossary");
  const rows = KANA_ROWS.map((row) => ({
    row,
    inRow: terms.filter((term) => term.kanaRow === row),
  })).filter(({ inRow }) => inRow.length > 0);

  return (
    <div className="space-y-6">
      {rows.map(({ row, inRow }, rowIndex) => {
        const adIndex = adIndexAfterGroup(rowIndex);
        const ad = adIndex === undefined ? undefined : ads[adIndex];

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
              {ad && <NativeAdRow creative={ad} />}
            </LinkRowList>
          </section>
        );
      })}
    </div>
  );
}
