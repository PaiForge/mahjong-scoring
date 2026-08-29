import type { getTranslations } from "next-intl/server";

import type { RankSlug } from "@/lib/ranks/registry";

import { rankExamHref } from "./practice-catalog";

type RanksTranslator = Awaited<ReturnType<typeof getTranslations<"ranks">>>;

/**
 * カタログの段級位を `PracticeCard` の `rank` prop に変換する
 * 段級位ピルの組み立て
 *
 * 練習一覧とダッシュボードのおすすめ練習が同じカードを使うため、名前・
 * 行き先・アクセシブル名の 3 つを両方で書き起こさないようここにまとめる。
 *
 * @param rank カタログの段級位。持たない練習は undefined（ピルを出さない）
 * @param tRanks `ranks` 名前空間の翻訳関数
 */
export function practiceCardRank(
  rank: RankSlug | undefined,
  tRanks: RanksTranslator,
) {
  if (rank === undefined) return undefined;

  const label = tRanks(`names.${rank}`);
  return {
    slug: rank,
    label,
    href: rankExamHref(rank),
    // pill には級名しか出ないため、リンクとしての名前は行き先まで含める
    ariaLabel: tRanks("examLink", { rank: label }),
  };
}
