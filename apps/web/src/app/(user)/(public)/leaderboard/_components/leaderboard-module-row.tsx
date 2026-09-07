import { getTranslations } from "next-intl/server";

import { LinkRow } from "@/app/(user)/_components/link-row";

import type { LeaderboardBoard, LeaderboardPeriod } from "../_lib/types";
import { buildDetailPath } from "../_lib/types";
import { boardTitle } from "../_lib/board-title";

interface LeaderboardModuleRowProps {
  readonly board: LeaderboardBoard;
  readonly period: LeaderboardPeriod;
  readonly rank: number | undefined;
}

/**
 * リーダーボード一覧の 1 行
 * ランキング行
 *
 * 土俵名（練習名 + バリアント）と自分の順位を出し、押すとその土俵の詳細
 * ランキングへ移る。
 * ランキングは見に行くもので押して始めるものではないため、太枠 + 影のカードでは
 * なく行リンクで並べる。
 *
 * 行頭には何も置かない。種目ごとに違う記号を 1 つ選ぼうとしても、記号で
 * 表せるのはせいぜい分野（符 / 翻数 / 点数）までで種目そのものではない。
 * その分野は一覧側が見出しで括るため、行はタイトルと順位だけを持つ。
 */
export async function LeaderboardModuleRow({
  board,
  period,
  rank,
}: LeaderboardModuleRowProps) {
  const t = await getTranslations("leaderboard");

  return (
    <LinkRow
      href={buildDetailPath(period, board)}
      title={await boardTitle(board)}
      trailing={
        rank !== undefined ? (
          <span className="text-sm font-bold tabular-nums text-primary-600">
            {t("rankLabel", { rank })}
          </span>
        ) : (
          <span className="text-xs text-surface-400">{t("notRanked")}</span>
        )
      }
    />
  );
}
