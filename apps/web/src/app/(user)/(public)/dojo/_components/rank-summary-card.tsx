import { getTranslations } from "next-intl/server";

import { beltBorderTopClass } from "@/lib/ranks/belt-colors";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { RankHeading } from "./rank-heading";

interface RankSummaryCardProps {
  readonly rankSlug: RankSlug;
}

/**
 * 進み具合を持たない級カード
 * 級の要約カード
 *
 * Server Component。`<article>` を返し、並べるときは呼び出し側が `<li>` で包む。
 * 道場の級の行程カード（`RankJourneyCard`）と同じ枠（上端だけ帯色）と見出し行
 * （{@link RankHeading}）を持ち、取得状態の pill と「学ぶ / 練習する / 試験」の
 * 進み具合だけを持たない。練習一覧のように本人の取得状況を読まない静的な
 * ページで級を掲げるためのもので、状態を推測して出すと取得済みの人に
 * 「未取得」と見せてしまう。級名から級の詳細ページへ送る。
 */
export async function RankSummaryCard({ rankSlug }: RankSummaryCardProps) {
  const [tDojo, tRanks] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
  ]);

  return (
    <article
      data-belt-slug={rankSlug}
      className={`rounded-panel border border-t-2 border-panel bg-white p-4 sm:p-5 ${beltBorderTopClass(rankSlug)}`}
    >
      <RankHeading rankSlug={rankSlug} tRanks={tRanks} tDojo={tDojo} />
    </article>
  );
}
