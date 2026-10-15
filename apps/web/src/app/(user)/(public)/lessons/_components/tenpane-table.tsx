import { getTranslations } from "next-intl/server";

import type { WinType } from "@mahjong-scoring/core";
import type { FixedHandShape } from "@mahjong-scoring/features/practice/score/hand-shape-param";

import {
  DATA_TABLE_CELL_PADDING,
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";

import { buildTenpaneRows } from "@mahjong-scoring/features/curriculum/tenpane-rows";

interface TenpaneTableProps {
  /** 門前手 / 副露した手のどちらの表か */
  readonly handShape: FixedHandShape;
  /** ツモ / ロンのどちらの表か */
  readonly winType: WinType;
}

/**
 * 符がテンパネする典型例の表
 * テンパネ典型例表
 *
 * 行は `buildTenpaneRows`（core の `mentsuTehaiFu` 由来）が組み立てる。
 * 例の文言は長く折り返すので行見出しセル（折り返さない）は使わず、計算と
 * 符の列だけを折り返さない。セルは狭い画面で列を詰める `dense` に揃える。
 */
export async function TenpaneTable({ handShape, winType }: TenpaneTableProps) {
  const t = await getTranslations("learnCurriculum");
  const rows = buildTenpaneRows(handShape, winType);

  return (
    <DataTable
      header={
        <>
          <DataTableHeaderCell align="left" density="dense">
            {t("tenpaneTable.colExample")}
          </DataTableHeaderCell>
          <DataTableHeaderCell density="dense">
            {t("tenpaneTable.colSum")}
          </DataTableHeaderCell>
          <DataTableHeaderCell density="dense">
            {t("tenpaneTable.colFu")}
          </DataTableHeaderCell>
        </>
      }
    >
      {rows.map((row) => (
        <tr key={row.key} className="bg-white">
          <td className={`${DATA_TABLE_CELL_PADDING.dense} text-surface-700`}>
            {t(`tenpaneExamples.${row.key}`)}
          </td>
          <td
            className={`${DATA_TABLE_CELL_PADDING.dense} text-center whitespace-nowrap text-surface-600`}
          >
            {t("tenpaneTable.sum", {
              start: row.startFu,
              extra: row.extraFu,
              total: row.totalFu,
            })}
          </td>
          <td
            className={`${DATA_TABLE_CELL_PADDING.dense} text-center font-semibold whitespace-nowrap text-foreground`}
          >
            {row.totalFu === row.fu
              ? t("tenpaneTable.fuExact", { value: row.fu })
              : t("tenpaneTable.fu", { value: row.fu })}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
