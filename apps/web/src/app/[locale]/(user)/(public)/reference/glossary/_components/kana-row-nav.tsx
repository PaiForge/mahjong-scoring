import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import {
  indexAnchorId,
  indexRowsFor,
} from "@mahjong-scoring/features/glossary/index-rows";
import type { GlossaryTermView } from "@mahjong-scoring/features/glossary/views";

interface KanaRowNavProps {
  readonly terms: readonly GlossaryTermView[];
  /** ページの言語（索引の行の集合が言語で変わる） */
  readonly locale: SupportedLocale;
}

/**
 * 索引の行へのジャンプ（日本語は五十音、英語は A〜Z）
 * 五十音ナビ
 *
 * 収録語が無い行はリンクにせず、薄い文字のまま置く。行が抜けると
 * 「わ行は無いのか、飛ばされたのか」が分からなくなるため、並びは常に
 * その言語の全行（日本語は あ行〜わ行、英語は A〜Z の 26 個）で固定して見せる。
 * 英語は 26 個あり 1 行に収まらないことがあるので、折り返し（`flex-wrap`）に任せる。
 */
export async function KanaRowNav({ terms, locale }: KanaRowNavProps) {
  const t = await getTranslations("glossary");
  const populated = new Set(terms.map((term) => term.indexRow));

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {indexRowsFor(locale).map((row) => {
        const label = t("kanaRowHeading", { row });
        return (
          <li key={row}>
            {populated.has(row) ? (
              <Link
                href={`#${indexAnchorId(row)}`}
                className={`text-sm ${TEXT_LINK_CLASSES}`}
              >
                {label}
              </Link>
            ) : (
              <span className="text-sm text-surface-300">{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
