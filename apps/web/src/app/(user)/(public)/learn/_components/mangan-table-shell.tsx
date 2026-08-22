import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { HIGH_SCORES } from "@mahjong-scoring/core";

import {
  DATA_TABLE_ALIGN_CLASS,
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";

import { HAN_DISPLAY } from "../_lib/han-display";

/** 満貫以上早見表の1行分のデータ */
export type ManganTableRow = (typeof HIGH_SCORES)[number];

/** 種類・翻数に続く列の定義 */
export interface ManganTableColumn {
  /** manganScoreTable 名前空間のヘッダーキー */
  readonly headerKey: string;
  readonly align: "left" | "right";
  /** セルに追加するクラス（強調表示など） */
  readonly cellClassName: string;
}

interface ManganTableShellProps {
  readonly columns: readonly ManganTableColumn[];
  /**
   * 種類・翻数に続くセルの内容（columns と同じ順・同じ数）
   *
   * @param row - 満貫以上の1帯
   * @param t - manganScoreTable 名前空間の翻訳関数（備考などで使う）
   */
  readonly renderCells: (
    row: ManganTableRow,
    t: (key: string) => string,
  ) => readonly ReactNode[];
}

/**
 * 満貫以上早見表の外殻
 * 満貫早見表シェル
 *
 * 満貫以上は翻数だけで点数が決まるため、どの表も「種類・翻数」の2列で始まる。
 * その2列と枠・ヘッダー・行の体裁をここに集約し、各表は続く列の定義と
 * セルの値だけを持つ。
 */
export async function ManganTableShell({
  columns,
  renderCells,
}: ManganTableShellProps) {
  const t = await getTranslations("manganScoreTable");
  const tScore = await getTranslations("scoreTable");

  return (
    <DataTable
      header={
        <>
          <DataTableHeaderCell align="left">{t("colType")}</DataTableHeaderCell>
          <DataTableHeaderCell align="right">{t("colHan")}</DataTableHeaderCell>
          {columns.map((column) => (
            <DataTableHeaderCell key={column.headerKey} align={column.align}>
              {t(column.headerKey)}
            </DataTableHeaderCell>
          ))}
        </>
      }
    >
      {HIGH_SCORES.map((row) => (
        <tr key={row.nameKey} className="bg-white">
          <td className="px-4 py-3 font-medium text-surface-900">
            {tScore(row.nameKey)}
          </td>
          <td className="px-4 py-3 text-right text-surface-600">
            {HAN_DISPLAY[row.nameKey]}
          </td>
          {renderCells(row, t).map((cell, index) => {
            const column = columns[index];
            return (
              <td
                key={column.headerKey}
                className={`px-4 py-3 ${DATA_TABLE_ALIGN_CLASS[column.align]} ${column.cellClassName}`}
              >
                {cell}
              </td>
            );
          })}
        </tr>
      ))}
    </DataTable>
  );
}

/** 点数を日本語ロケールの桁区切りで表示する */
export function formatPoints(points: number): string {
  return points.toLocaleString("ja-JP");
}
