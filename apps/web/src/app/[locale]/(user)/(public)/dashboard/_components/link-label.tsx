import type { ReactNode } from "react";

import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";

/**
 * ダッシュボードのリンクの文言に、言語をまたぐときだけ「日本語のみ」を添える
 * リンク文言
 *
 * 言語をまたがない（日本語のページ・英語で公開済みの行き先）ときは文言を
 * そのまま返す。`{crossLocale && <JapaneseOnlyMark />}` と並べて書くと、
 * 日本語のページでもリンクの children が `[文言, false]` の配列になり、
 * RSC のペイロードが英語化の前と変わる。日本語の出力を 1 文字も動かさないため、
 * 印が要るときだけ文言と印を束ねる。
 *
 * @param label - リンクの文言
 * @param target - リンクの張る先（`resolveNavTargetFor` の結果）
 * @param japaneseOnlyLabel - 「日本語のみ」の文言（`nav.language.japaneseOnly`）
 */
export function linkLabel(
  label: ReactNode,
  target: NavTarget,
  japaneseOnlyLabel: string,
): ReactNode {
  if (!target.crossLocale) return label;
  return (
    <>
      {label}
      <JapaneseOnlyMark label={japaneseOnlyLabel} />
    </>
  );
}
