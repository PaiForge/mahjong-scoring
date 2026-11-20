import { getTranslations } from "next-intl/server";

import {
  NUMBER_CELL_CLASSES,
  TotalBarCell,
  UnknownValueCell,
} from "@/app/admin/_components/stats-table-cells";
import { TableHead } from "@/app/admin/_components/table-head";
import { formatAdminDateTime } from "@/app/admin/_lib/format-date";

import type { PracticeProblemStatRow } from "../_lib/practice-problem-stats";

/** 列の並び（左から）。見出しの辞書キー `admin.practiceProblemStats.sourceTable.columns.<key>` と同じ */
const COLUMNS = ["kind", "source", "period", "total", "lastSavedAt"] as const;

/**
 * 種別 × 由来ごとの保存数の表
 * 問題保存由来テーブル
 *
 * 列は左から 種別 / 由来 / 期間内 / 累計 / 最終保存。行は種別 × 由来の全組（0 件も
 * 含む）で、0 件の組（例: android）が「その入口から届いていない」ことを示す。
 * 定数に無い値の行（`known: false`）は種別・由来を生の値のまま `<code>` で出し、
 * 「現在の定義に無い値」の注記を添える。表示名の辞書キーは定数の値にしか無く、
 * 定数に無い値でキーを引くと next-intl が欠落キーで落ちるため、引かない。
 *
 * @design 累計に添える横棒は「表の中での相対的な多さ」だけを表す
 * 幅は `total / maxTotal`（表の最大を 100%）。数字が本体なので棒は `aria-hidden`。
 */
export async function SourceStatsTable({
  rows,
  maxTotal,
}: {
  readonly rows: readonly PracticeProblemStatRow[];
  /** 横棒の分母（全行の total の最大）。0 なら棒は出ない */
  readonly maxTotal: number;
}) {
  const t = await getTranslations("admin.practiceProblemStats");

  return (
    <div className="admin-table">
      <table className="w-full text-left text-sm">
        {/* 例: admin.practiceProblemStats.sourceTable.columns.kind */}
        <TableHead
          labels={COLUMNS.map((key) => t(`sourceTable.columns.${key}`))}
        />
        <tbody>
          {rows.map((row) => {
            return (
              <tr
                key={`${row.kind}\n${row.source}`}
                className="border-t border-surface-200"
              >
                {row.known ? (
                  <>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {/* 例: admin.practiceProblemStats.kinds.agari-score */}
                      {t(`kinds.${row.kind}`)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-surface-600">
                      {/* 例: admin.practiceProblemStats.sources.ios */}
                      {t(`sources.${row.source}`)}
                    </td>
                  </>
                ) : (
                  <>
                    <UnknownValueCell value={row.kind} note={t("unknownRow")} />
                    <td className="px-4 py-3 whitespace-nowrap text-surface-600">
                      <code>{row.source}</code>
                    </td>
                  </>
                )}
                <td className={NUMBER_CELL_CLASSES}>
                  {row.inPeriod.toLocaleString("ja-JP")}
                </td>
                <TotalBarCell total={row.total} maxTotal={maxTotal} />
                <td className="px-4 py-3 whitespace-nowrap text-surface-600 tabular-nums">
                  {formatAdminDateTime(row.lastSavedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
