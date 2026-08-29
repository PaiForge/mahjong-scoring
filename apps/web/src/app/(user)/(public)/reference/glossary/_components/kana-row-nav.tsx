import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { KANA_ROWS, kanaAnchorId } from "@/lib/glossary/kana";
import type { GlossaryTermView } from "@/lib/glossary/queries";

interface KanaRowNavProps {
  readonly terms: readonly GlossaryTermView[];
}

/**
 * 五十音行へのジャンプ
 * 五十音ナビ
 *
 * 収録語が無い行はリンクにせず、薄い文字のまま置く。行が抜けると
 * 「わ行は無いのか、飛ばされたのか」が分からなくなるため、並びは常に
 * あ行から わ行まで固定で見せる。
 */
export async function KanaRowNav({ terms }: KanaRowNavProps) {
  const t = await getTranslations("glossary");
  const populated = new Set(terms.map((term) => term.kanaRow));

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {KANA_ROWS.map((row) => {
        const label = t("kanaRowHeading", { row });
        return (
          <li key={row}>
            {populated.has(row) ? (
              <Link
                href={`#${kanaAnchorId(row)}`}
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
