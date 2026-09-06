import { getTranslations } from "next-intl/server";

import { LinkRow } from "@/app/(user)/_components/link-row";
import { menuTypeToMessageKey } from "@/lib/db/practice-menu-types";

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
 * 行頭の絵文字はモジュールごとに違うので残す（同じ絵文字が並ぶだけの
 * アイコンは置かない、という判断の裏返し）。
 */
export async function LeaderboardModuleRow({
  board,
  period,
  rank,
}: LeaderboardModuleRowProps) {
  const t = await getTranslations("leaderboard");

  const msgKey = menuTypeToMessageKey(board.module);

  return (
    <LinkRow
      href={buildDetailPath(period, board)}
      leading={
        <span className="text-base" aria-hidden="true">
          {t(`moduleIcon.${msgKey}`)}
        </span>
      }
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
