import type { ReactNode } from "react";
import {
  DATA_TABLE_CELL_PADDING,
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { REFERENCE_TABLE_MAX_WIDTH } from "../_lib/reference-table-width";

interface ExampleTableRow {
  /** 牌のセルの中身（{@link TileSet} 等のクライアントコンポーネント） */
  readonly tiles: ReactNode;
  /** 翻訳済みの種類ラベル */
  readonly label: string;
  /** 符数（0 のときは控えめなスタイルで表示） */
  readonly fu: number;
}

interface ExampleTableProps {
  /** 翻訳済みの表題（例: "三元牌の例"） */
  readonly title: string;
  /** 翻訳済みの「牌」列ヘッダ */
  readonly colTiles: string;
  /** 翻訳済みの「種類」列ヘッダ */
  readonly colKind: string;
  /** 翻訳済みの「符」列ヘッダ */
  readonly colFu: string;
  /** 符数を表示文字列に変換する（例: t("fuUnit", { value })） */
  readonly formatFu: (value: number) => string;
  /** 表示する行（並び順は呼び出し側の指定どおり） */
  readonly rows: readonly ExampleTableRow[];
}

/**
 * 教本の例示表（牌×種類×符の3列テーブル）
 * 例示表
 *
 * 例示を {@link FuSummaryTable} と同じ体裁の表で示し、どの列が何を表すかを
 * 見出し行で明示する。符の強調ルールも早見表と揃える。
 *
 * セルの余白は `dense`（狭い画面でだけ左右を詰める）。牌の列は牌画像の枚数で
 * 幅が決まり縮まないため、既定の px-4 では狭い画面で符の列が枠から溢れる。
 */
export function ExampleTable({
  title,
  colTiles,
  colKind,
  colFu,
  formatFu,
  rows,
}: ExampleTableProps) {
  return (
    <div className={`space-y-2 ${REFERENCE_TABLE_MAX_WIDTH}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
        {title}
      </h3>
      <DataTable
        header={
          <>
            <DataTableHeaderCell align="left" density="dense">
              {colTiles}
            </DataTableHeaderCell>
            <DataTableHeaderCell align="left" density="dense">
              {colKind}
            </DataTableHeaderCell>
            <DataTableHeaderCell align="right" density="dense">
              {colFu}
            </DataTableHeaderCell>
          </>
        }
      >
        {rows.map((row, index) => {
          const hasFu = row.fu > 0;
          return (
            <tr key={index} className="bg-white">
              <td className={DATA_TABLE_CELL_PADDING.dense}>{row.tiles}</td>
              <td
                className={`w-full ${DATA_TABLE_CELL_PADDING.dense} ${hasFu ? "text-surface-900" : "text-surface-500"}`}
              >
                {row.label}
              </td>
              <td
                className={`${DATA_TABLE_CELL_PADDING.dense} text-right whitespace-nowrap ${hasFu ? "font-semibold text-primary-600" : "text-surface-400"}`}
              >
                {formatFu(row.fu)}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
