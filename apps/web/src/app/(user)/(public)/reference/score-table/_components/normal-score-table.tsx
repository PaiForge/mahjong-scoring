"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import type { calculateKoScore } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { HAN_COLS, FU_ROWS } from "../_lib/score-table-utils";
import type { NormalCellHighlight } from "../_lib/score-table-utils";
import { TsumoScore } from "./tsumo-score";

const FREQUENT_FU = new Set([30, 40]);

interface NormalScoreTableProps {
  /** `${han}-${fu}` → 点数計算結果のグリッド */
  readonly scoreGrid: ReadonlyMap<string, ReturnType<typeof calculateKoScore>>;
  readonly activeTab: Role;
  readonly winType: WinType;
  readonly hiddenCells: Readonly<Record<string, boolean>>;
  /** ハイライト対象セル（翻の列 × 符の行）。未指定ならハイライトなし */
  readonly highlight: NormalCellHighlight | undefined;
  readonly highlightRef: RefObject<HTMLTableCellElement | null>;
  readonly onToggleCell: (id: string) => void;
}

/**
 * 満貫未満の符×翻 点数表
 * 通常点数表
 *
 * セルのタップでぼかし表示を切り替える（暗記用）。
 * highlight で指定されたセルはハイライトし、初期表示時に画面中央へスクロールされる。
 */
export function NormalScoreTable({
  scoreGrid,
  activeTab,
  winType,
  hiddenCells,
  highlight,
  highlightRef,
  onToggleCell,
}: NormalScoreTableProps) {
  const t = useTranslations("scoreTable");

  return (
    <DataTable
      tableClassName="text-center"
      header={
        <>
          <DataTableHeaderCell align="left">
            {t("fuSuffix")}
            {"＼"}
            {t("hanSuffix")}
          </DataTableHeaderCell>
          {HAN_COLS.map((han) => (
            <DataTableHeaderCell key={han}>
              {han}
              {t("hanSuffix")}
            </DataTableHeaderCell>
          ))}
        </>
      }
    >
      {FU_ROWS.map((fu) => {
        const isFrequent = FREQUENT_FU.has(fu);

        return (
          <tr key={fu} className="bg-white">
            <td
              className={`px-4 py-3 text-left font-medium ${
                isFrequent ? "text-amber-700" : "text-surface-600"
              }`}
            >
              {fu}
            </td>
            {HAN_COLS.map((han) => {
              const score = scoreGrid.get(`${han}-${fu}`);
              if (!score) {
                return (
                  <td key={han} className="px-4 py-3 text-surface-400">
                    -
                  </td>
                );
              }

              const cellId = `${activeTab}-${winType}-${han}han-${fu}fu`;
              const isHidden = !!hiddenCells[cellId];
              const isHighlighted =
                highlight !== undefined &&
                highlight.han === han &&
                highlight.fu === fu;
              const highlightClass = isHighlighted
                ? " bg-amber-100 ring-2 ring-inset ring-amber-400"
                : "";

              return (
                <td
                  key={han}
                  ref={isHighlighted ? highlightRef : undefined}
                  className={`px-4 py-3 cursor-pointer select-none${highlightClass}`}
                  onClick={() => onToggleCell(cellId)}
                >
                  <span
                    className={`font-semibold text-primary-600 ${
                      isHidden ? "blur-md" : ""
                    }`}
                  >
                    {score.isMangan ? (
                      t("mangan")
                    ) : winType === "ron" ? (
                      score.ron
                    ) : (
                      <TsumoScore payment={score.tsumo} />
                    )}
                  </span>
                </td>
              );
            })}
          </tr>
        );
      })}
    </DataTable>
  );
}
