import { getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  NUMBER_CELL_CLASSES,
  TotalBarCell,
  UnknownValueCell,
} from "@/app/admin/_components/stats-table-cells";
import { TableHead } from "@/app/admin/_components/table-head";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

import {
  registryPositionOf,
  type ChallengeStatRow,
} from "../_lib/challenge-stats";

/** 列の並び（左から）。見出しの辞書キー `admin.challengeStats.table.<key>` と同じ */
const COLUMNS = [
  "order",
  "practice",
  "period",
  "challengers",
  "total",
] as const;

/**
 * 練習ごとのチャレンジの回数の表
 * チャレンジ実施数テーブル
 *
 * 列は左から レジストリ順の番号 / 練習 / 期間内 / 期間内の挑戦者 / 累計。番号は
 * レジストリ順（練習一覧の並び）での 1 始まりで、並び順を変えても同じ練習は同じ番号に
 * なる。表の練習に無い行（廃止した練習等）は番号を「—」にし、練習名の代わりに
 * menu_type の生の値をリンクにせず出す。
 *
 * @design 累計に添える横棒は「表の中での相対的な多さ」だけを表す
 * 幅は `total / maxTotal`（表の最大を 100%）。レッスンの完了状況と同じく、追加の
 * データ無しでどの練習が多いか少ないかを一目で分からせるためのもの。数字が本体なので
 * 棒は `aria-hidden`。
 */
export async function ChallengeStatsTable({
  rows,
  maxTotal,
}: {
  readonly rows: readonly ChallengeStatRow[];
  /** 横棒の分母（全行の total の最大）。0 なら棒は出ない */
  readonly maxTotal: number;
}) {
  const [t, tPractices] = await Promise.all([
    getTranslations("admin.challengeStats"),
    getTranslations("practice.practices"),
  ]);

  return (
    <div className="admin-table">
      <table className="w-full text-left text-sm">
        {/* 例: admin.challengeStats.table.order */}
        <TableHead labels={COLUMNS.map((key) => t(`table.${key}`))} />
        <tbody>
          {rows.map((row) => {
            const position = registryPositionOf(row.practice);
            return (
              <tr key={row.menuType} className="border-t border-surface-200">
                <td className="px-4 py-3 whitespace-nowrap text-surface-500 tabular-nums">
                  {position === undefined ? "—" : position}
                </td>
                {row.practice === undefined ? (
                  <UnknownValueCell
                    value={row.menuType}
                    note={t("unknownPractice")}
                  />
                ) : (
                  <td className="px-4 py-3">
                    <Link
                      href={row.practice.basePath}
                      className={TEXT_LINK_CLASSES}
                    >
                      {/* 例: practice.practices.jantouFu.title */}
                      {tPractices(`${row.practice.messageKey}.title`)}
                    </Link>
                  </td>
                )}
                <td className={NUMBER_CELL_CLASSES}>
                  {row.inPeriod.toLocaleString("ja-JP")}
                </td>
                <td className={NUMBER_CELL_CLASSES}>
                  {row.challengersInPeriod.toLocaleString("ja-JP")}
                </td>
                <TotalBarCell total={row.total} maxTotal={maxTotal} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
