import { getTranslations } from "next-intl/server";

import { getMedalEmoji } from "../_lib/podium";

interface RankBadgeProps {
  readonly rank: number;
}

/**
 * 順位バッジ
 * 上位3位はメダル、それ以降は順位の数字を表示する
 *
 * メダルは絵文字そのものが順位を語るため、数字は併記しない。読み上げには
 * 「1 位」と伝わるよう aria-label を付ける（絵文字の既定の読みは環境依存で、
 * 英語名が読まれることもある）。
 */
export async function RankBadge({ rank }: RankBadgeProps) {
  const medal = getMedalEmoji(rank);

  if (medal !== undefined) {
    const t = await getTranslations("leaderboard");

    return (
      <span
        className="inline-flex size-8 items-center justify-center text-xl"
        role="img"
        aria-label={t("rankLabel", { rank })}
      >
        {medal}
      </span>
    );
  }

  return (
    <span className="inline-flex size-8 items-center justify-center text-sm font-medium text-surface-400">
      {rank}
    </span>
  );
}
