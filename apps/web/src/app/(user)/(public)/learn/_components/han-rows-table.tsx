import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import {
  DataTable,
  DataTableHeaderCell,
  DataTableRowHeaderCell,
} from "@/app/(user)/_components/data-table";

/** 翻を行に取る表の 1 列ぶんの定義 */
export interface HanRowsTableColumn<TRow> {
  /** ヘッダーセルの中身 */
  readonly header: ReactNode;
  /** その行のセルの中身 */
  readonly render: (row: TRow) => ReactNode;
  /** セルの追加クラス（強調の色など）。余白は表側が持つので指定しない */
  readonly className?: string;
}

interface HanRowsTableProps<TRow extends { readonly han: number }> {
  readonly rows: readonly TRow[];
  /** 翻の列より右に並べる列。左端の翻の列は表が自前で描く */
  readonly columns: readonly HanRowsTableColumn<TRow>[];
}

/**
 * 翻を行に取る教本の早見表
 * 翻の早見表
 *
 * 「1翻・2翻・3翻…」を行見出しに、比べたい数字を列に並べる表。教本で
 * 倍々・半分ずつ・ツモの内訳を見せる表がこの形を共有しており、左端の翻の
 * 列とヘッダーの体裁はどれも同じなのでここで描く。各章が渡すのは右側の列の
 * 定義だけになる。
 *
 * 見出し（「子のロン（30符）」等）は含まない。章ごとに見出しの強さが違う
 * ため、表の外側で各章が自分の見出しを置く。
 *
 * 横スクロールは表自身が持つ。列が増えると狭い画面で溢れるが、ページ全体を
 * 横に流すと本文まで動いてしまうため、溢れるのは表の中だけに閉じる。
 */
export async function HanRowsTable<TRow extends { readonly han: number }>({
  rows,
  columns,
}: HanRowsTableProps<TRow>) {
  const t = await getTranslations("learnCurriculum.scoreTable");

  return (
    <div className="w-full overflow-x-auto">
      <DataTable
        tableClassName="text-center"
        header={
          <>
            <DataTableHeaderCell align="left">
              {t("colHan")}
            </DataTableHeaderCell>
            {columns.map((column, index) => (
              <DataTableHeaderCell key={index}>
                {column.header}
              </DataTableHeaderCell>
            ))}
          </>
        }
      >
        {rows.map((row) => (
          <tr key={row.han} className="bg-white">
            <DataTableRowHeaderCell>
              {t("hanUnit", { value: row.han })}
            </DataTableRowHeaderCell>
            {columns.map((column, index) => (
              <td
                key={index}
                className={["px-4 py-3", column.className]
                  .filter(Boolean)
                  .join(" ")}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
