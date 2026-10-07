import { getTranslations } from "next-intl/server";

/**
 * リーダーボードテーブルヘッダー
 * ランキングテーブルの見出し行
 */
export async function LeaderboardTableHeader() {
  const t = await getTranslations("leaderboard");

  return (
    <thead>
      <tr className="border-b border-panel bg-surface-50">
        <th className="py-3 px-3 text-center text-xs font-medium text-surface-500 w-16">
          {t("table.rank")}
        </th>
        <th className="py-3 px-3 text-left text-xs font-medium text-surface-500">
          {t("table.player")}
        </th>
        <th className="py-3 px-3 text-right text-xs font-medium text-surface-500 w-20">
          {t("table.score")}
        </th>
        <th className="py-3 px-3 text-right text-xs font-medium text-surface-500 w-24">
          {t("table.miss")}
        </th>
      </tr>
    </thead>
  );
}
