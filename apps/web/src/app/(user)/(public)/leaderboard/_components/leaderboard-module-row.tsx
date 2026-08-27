import { getTranslations } from "next-intl/server";

import { LinkRow } from "@/app/(user)/_components/link-row";
import { menuTypeToMessageKey } from "@/lib/db/practice-menu-types";

import type { LeaderboardModule, LeaderboardPeriod } from "../_lib/types";
import { buildDetailPath } from "../_lib/types";

interface LeaderboardModuleRowProps {
  readonly module: LeaderboardModule;
  readonly period: LeaderboardPeriod;
  readonly rank: number | undefined;
}

/**
 * リーダーボード一覧の 1 行
 * ランキング行
 *
 * モジュール名と自分の順位を出し、押すとそのモジュールの詳細ランキングへ移る。
 * ランキングは見に行くもので押して始めるものではないため、太枠 + 影のカードでは
 * なく行リンクで並べる。
 *
 * 行頭の絵文字はモジュールごとに違うので残す（同じ絵文字が並ぶだけの
 * アイコンは置かない、という判断の裏返し）。
 */
export async function LeaderboardModuleRow({
  module,
  period,
  rank,
}: LeaderboardModuleRowProps) {
  const t = await getTranslations("leaderboard");
  const tPractices = await getTranslations("practice.practices");

  const msgKey = menuTypeToMessageKey(module);

  return (
    <LinkRow
      href={buildDetailPath(period, module)}
      leading={
        <span className="text-base" aria-hidden="true">
          {t(`moduleIcon.${msgKey}`)}
        </span>
      }
      title={tPractices(`${msgKey}.shortTitle`)}
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
