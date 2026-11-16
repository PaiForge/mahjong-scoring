import { getTranslations } from "next-intl/server";
import Link from "next/link";

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

/** 数値のセル（右寄せ・桁揃え） */
const NUMBER_CELL_CLASSES =
  "px-4 py-3 text-right whitespace-nowrap tabular-nums";

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
            const ratio = maxTotal === 0 ? 0 : row.total / maxTotal;
            return (
              <tr key={row.menuType} className="border-t border-surface-200">
                <td className="px-4 py-3 whitespace-nowrap text-surface-500 tabular-nums">
                  {position === undefined ? "—" : position}
                </td>
                <td className="px-4 py-3">
                  {row.practice === undefined ? (
                    <span className="space-y-1">
                      <code className="block">{row.menuType}</code>
                      <span className="block text-xs text-surface-500">
                        {t("unknownPractice")}
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={row.practice.basePath}
                      className={TEXT_LINK_CLASSES}
                    >
                      {/* 例: practice.practices.jantouFu.title */}
                      {tPractices(`${row.practice.messageKey}.title`)}
                    </Link>
                  )}
                </td>
                <td className={NUMBER_CELL_CLASSES}>
                  {row.inPeriod.toLocaleString("ja-JP")}
                </td>
                <td className={NUMBER_CELL_CLASSES}>
                  {row.challengersInPeriod.toLocaleString("ja-JP")}
                </td>
                <td className={NUMBER_CELL_CLASSES}>
                  <span className="block">
                    {row.total.toLocaleString("ja-JP")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-1 ml-auto block h-1.5 w-24 overflow-hidden rounded-full bg-surface-100"
                  >
                    <span
                      className="block h-full rounded-full bg-primary-600"
                      style={{ width: `${String(ratio * 100)}%` }}
                    />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
