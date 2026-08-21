import type { ReactNode } from "react";
import { DataTable, DataTableHeaderCell } from "@/app/_components/data-table";

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
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
        {title}
      </h3>
      <DataTable
        header={
          <>
            <DataTableHeaderCell align="left">{colTiles}</DataTableHeaderCell>
            <DataTableHeaderCell align="left">{colKind}</DataTableHeaderCell>
            <DataTableHeaderCell align="right">{colFu}</DataTableHeaderCell>
          </>
        }
      >
        {rows.map((row, index) => {
          const hasFu = row.fu > 0;
          return (
            <tr key={index} className="bg-white">
              <td className="px-4 py-3">{row.tiles}</td>
              <td
                className={`w-full px-4 py-3 ${hasFu ? "text-surface-900" : "text-surface-500"}`}
              >
                {row.label}
              </td>
              <td
                className={`px-4 py-3 text-right whitespace-nowrap ${hasFu ? "font-semibold text-primary-600" : "text-surface-400"}`}
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
