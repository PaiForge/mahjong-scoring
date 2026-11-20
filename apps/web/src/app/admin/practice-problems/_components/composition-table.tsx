import { getTranslations } from "next-intl/server";

import { NUMBER_CELL_CLASSES } from "@/app/admin/_components/stats-table-cells";
import { TableHead } from "@/app/admin/_components/table-head";
import { ARCHIVE_KINDS, type ArchiveKind } from "@mahjong-scoring/core";

import { percentOf } from "../_lib/practice-problem-stats";
import type { PracticeProblemCompositionRow } from "../_lib/queries";

/** 列の並び（左から）。見出しの辞書キー `admin.practiceProblemStats.composition.columns.<key>` と同じ */
const COLUMNS = ["kind", "total", "riichi", "furo", "tsumo", "oya"] as const;

/** 割合を添える条件の列（`COLUMNS` の 3 列目以降と同じ並び） */
const CONDITIONS = ["riichi", "furo", "tsumo", "oya"] as const;

/** 和了の仕方（ツモ / ロン）を持たない種別。ツモの列は数えず「—」にする */
const KINDS_WITHOUT_TSUMO: ReadonlySet<ArchiveKind> = new Set(["tenpai-score"]);

/**
 * 種別ごとの盤面の内訳の表
 * 問題盤面内訳テーブル
 *
 * 行は `ARCHIVE_KINDS` の順で、DB に行が無い種別も全部 0 で並べる。列は左から
 * 種別 / 保存数 / リーチ / 副露あり / ツモ / 親 で、条件の列は「件数（割合%）」。
 * 保存数 0 の種別は割合を出さず件数だけにする（分母 0 の割合は意味を持たない）。
 * 聴牌形のツモは「—」（聴牌形は和了の仕方が決まっていない）。定数に無い種別の行は
 * 出さない — 由来の表に生の値で出ており、内訳の条件が当てはまる形かも分からない。
 */
export async function CompositionTable({
  rows,
}: {
  readonly rows: readonly PracticeProblemCompositionRow[];
}) {
  const t = await getTranslations("admin.practiceProblemStats");
  const rowByKind = new Map(rows.map((row) => [row.kind, row]));

  return (
    <div className="admin-table">
      <table className="w-full text-left text-sm">
        {/* 例: admin.practiceProblemStats.composition.columns.riichi */}
        <TableHead
          labels={COLUMNS.map((key) => t(`composition.columns.${key}`))}
        />
        <tbody>
          {ARCHIVE_KINDS.map((kind) => {
            const row = rowByKind.get(kind);
            const total = row?.total ?? 0;
            return (
              <tr key={kind} className="border-t border-surface-200">
                <td className="px-4 py-3 whitespace-nowrap">
                  {/* 例: admin.practiceProblemStats.kinds.tenpai-score */}
                  {t(`kinds.${kind}`)}
                </td>
                <td className={NUMBER_CELL_CLASSES}>
                  {total.toLocaleString("ja-JP")}
                </td>
                {CONDITIONS.map((condition) => {
                  if (condition === "tsumo" && KINDS_WITHOUT_TSUMO.has(kind)) {
                    return (
                      <td
                        key={condition}
                        className={`${NUMBER_CELL_CLASSES} text-surface-500`}
                      >
                        —
                      </td>
                    );
                  }
                  const count = row?.[condition] ?? 0;
                  const percent = percentOf(count, total);
                  const formatted = count.toLocaleString("ja-JP");
                  return (
                    <td key={condition} className={NUMBER_CELL_CLASSES}>
                      {percent === undefined
                        ? formatted
                        : t("composition.cell", {
                            count: formatted,
                            percent: String(percent),
                          })}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
