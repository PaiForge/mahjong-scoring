import { getTranslations } from "next-intl/server";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  LinkRow,
  LinkRowList,
} from "@/app/[locale]/(user)/_components/link-row";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import { NativeAdRow } from "@/app/[locale]/(user)/_components/native-ad-row";
import type { NativeAdView } from "@mahjong-scoring/features/ads/native-ad";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import {
  indexAnchorId,
  indexRowsFor,
} from "@mahjong-scoring/features/glossary/index-rows";
import type { GlossaryTermView } from "@mahjong-scoring/features/glossary/views";

interface KanaTermListProps {
  readonly terms: readonly GlossaryTermView[];
  /** 行の末尾に混ぜる広告（並び順どおり）。掲載中が無ければ空 */
  readonly ads: readonly NativeAdView[];
  /** ページの言語（索引の行と、用語ページへのリンクの言語） */
  readonly locale: SupportedLocale;
}

/**
 * 索引順の用語一覧（日本語は五十音、英語は A〜Z）
 * 五十音一覧
 *
 * 行ごとに見出しを立て、その中は索引の順（`glossaryTermViews` の並び）に並べる。
 * 行の中に置くのは語と読みだけ — 意味は用語ページに置き、一覧はどこに何が
 * あるかを見せる役に徹する。
 *
 * ネイティブ広告は語のある行の末尾に 1 行ずつ、間隔を広げながら置く
 * （`adIndexAfterGroup`）。語の無い行は描かないので、間隔にも数えない。
 *
 * 用語ページへのリンクはページの言語で張る（`resolveNavTargetFor`。英語は
 * `/en/reference/glossary/<slug>`）。その言語で用語ページを出していなければ
 * 日本語のページへ素のリンクで向けて「日本語のみ」と添える。
 */
export async function KanaTermList({ terms, ads, locale }: KanaTermListProps) {
  const t = await getTranslations("glossary");
  const tNav = await getTranslations("nav");
  const rows = indexRowsFor(locale)
    .map((row) => ({
      row,
      inRow: terms.filter((term) => term.indexRow === row),
    }))
    .filter(({ inRow }) => inRow.length > 0);

  return (
    <div className="space-y-6">
      {rows.map(({ row, inRow }, rowIndex) => {
        const adIndex = adIndexAfterGroup(rowIndex);
        const ad = adIndex === undefined ? undefined : ads[adIndex];

        return (
          <section key={row} className="space-y-1">
            {/* ヘッダに隠れないよう、行見出しの上に余白を取ってからスクロールする */}
            <h3
              id={indexAnchorId(row)}
              className="scroll-mt-24 text-sm font-bold text-surface-900"
            >
              {t("kanaRowHeading", { row })}
            </h3>
            <LinkRowList>
              {inRow.map((term) => {
                const target = resolveNavTargetFor(term.href, locale);
                return (
                  <LinkRow
                    key={term.slug}
                    href={target.href}
                    hrefLang={target.crossLocale ? DEFAULT_LOCALE : undefined}
                    title={term.term}
                    description={term.reading}
                    trailing={
                      target.crossLocale ? (
                        <JapaneseOnlyMark
                          label={tNav("language.japaneseOnly")}
                        />
                      ) : undefined
                    }
                  />
                );
              })}
              {ad && <NativeAdRow creative={ad} />}
            </LinkRowList>
          </section>
        );
      })}
    </div>
  );
}
