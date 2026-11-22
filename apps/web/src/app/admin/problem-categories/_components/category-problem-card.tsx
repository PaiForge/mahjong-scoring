import { getTranslations } from "next-intl/server";

import { TableHead } from "@/app/admin/_components/table-head";
import { adminChipClasses } from "@/app/admin/_lib/chip-classes";
import { formatAdminDateTime } from "@/app/admin/_lib/format-date";
import { SCORE_YAKU_NAME_MAP } from "@mahjong-scoring/core";

import { ProblemBoard } from "../../problem-reports/_components/problem-board";
import { TileList } from "../../problem-reports/_components/tile-list";
import type { CategoryProblem } from "../_lib/queries";
import { RULE_FLAGS } from "../_lib/rule-flags";

/** 和了の表の列（左から）。見出しの辞書キー `admin.problemCategories.problem.columns.<key>` と同じ */
const COLUMNS = [
  "agariHai",
  "winType",
  "score",
  "yaku",
  "machi",
  "rules",
] as const;

/** 属性の行の列と、印の対応 */
const FLAG_VALUES = {
  renfonpai: "variesByRenfonpai",
  kiriage: "variesByKiriage",
  yakumanRules: "variesByYakumanRules",
} as const;

/**
 * 分類に当てはまる問題 1 問（盤面 + 和了ごとの属性）
 * 問題分類カード
 *
 * 上に保存した盤面（問題の報告の詳細と同じ部品）、下に和了ごとの属性の表を出す。
 * 和了形は 1 行、聴牌形は待ち × ツモ/ロンの行。値は標準ルールでの正解で、連風牌 4 符・
 * 切り上げ満貫・役満ルールを切り替えると変わる和了には「ルールで変わる」の印を出す。
 * 役が無くロンできない和了は「役なし」とだけ出す。役の名前は core の内訳の表示名
 * （`SCORE_YAKU_NAME_MAP`。場風・自風は「場風牌 / 自風牌」）。
 */
export async function CategoryProblemCard({
  problem,
}: {
  readonly problem: CategoryProblem;
}) {
  const t = await getTranslations("admin.problemCategories");
  const tKinds = await getTranslations("admin.practiceProblemStats.kinds");
  const known = (["agari-score", "tenpai-score"] as const).find(
    (kind) => kind === problem.kind,
  );

  return (
    <section className="admin-panel space-y-3 p-5">
      <h4 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm font-bold text-surface-900">
        {/* 例: admin.practiceProblemStats.kinds.agari-score */}
        <span>{known ? tKinds(known) : problem.kind}</span>
        <span className="font-mono text-xs font-normal text-surface-500">
          {problem.id}
        </span>
        <span className="text-xs font-normal text-surface-500">
          {t("problem.savedAt", {
            date: formatAdminDateTime(problem.createdAt),
          })}
        </span>
      </h4>
      <ProblemBoard payload={problem.payload} />
      <div className="admin-table">
        <table className="w-full text-left text-sm">
          {/* 例: admin.problemCategories.problem.columns.winType */}
          <TableHead
            labels={COLUMNS.map((key) => t(`problem.columns.${key}`))}
          />
          <tbody>
            {problem.rows.map((row) => {
              const flags = RULE_FLAGS.filter(
                (flag) => row[FLAG_VALUES[flag]] === true,
              );
              return (
                <tr
                  key={`${String(row.agariHai)}:${String(row.isTsumo)}`}
                  className="border-t border-surface-200"
                >
                  <td className="px-4 py-2">
                    <TileList hais={[row.agariHai]} />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {row.isTsumo ? t("problem.tsumo") : t("problem.ron")}
                  </td>
                  {row.result === "scored" ? (
                    <>
                      <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                        {t("problem.score", {
                          han: row.han ?? 0,
                          fu: row.fu ?? 0,
                          points: row.points ?? 0,
                        })}
                      </td>
                      <td className="px-4 py-2">
                        {(row.yaku ?? [])
                          .map((id) => SCORE_YAKU_NAME_MAP[id] ?? id)
                          .join("・")}
                        {(row.doraHan ?? 0) + (row.uraDoraHan ?? 0) > 0 &&
                          ` ${t("problem.dora", {
                            dora: row.doraHan ?? 0,
                            uraDora: row.uraDoraHan ?? 0,
                          })}`}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {/* 例: admin.problemCategories.machi.Ryanmen */}
                        {row.machi ? t(`machi.${row.machi}`) : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="flex flex-wrap gap-1">
                          {flags.map((flag) => (
                            <span
                              key={flag}
                              className={adminChipClasses("warning")}
                            >
                              {/* 例: admin.problemCategories.flags.kiriage */}
                              {t(`flags.${flag}`)}
                            </span>
                          ))}
                        </span>
                      </td>
                    </>
                  ) : (
                    <td colSpan={4} className="px-4 py-2 text-surface-500">
                      {t("problem.noYaku")}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
