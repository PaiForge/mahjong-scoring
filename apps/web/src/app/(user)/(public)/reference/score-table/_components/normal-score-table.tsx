"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import type { calculateKoScore } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import {
  TABLE_HIGHLIGHT_FOCUS_CLASS,
  TABLE_HIGHLIGHT_HEADER_CLASS,
} from "@/app/(user)/_components/_lib/table-highlight";
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
  /** セルタップでのぼかし切り替え。省略時はセルを非インタラクティブにする */
  readonly onToggleCell: ((id: string) => void) | undefined;
}

/**
 * 満貫未満の符×翻 点数表
 * 通常点数表
 *
 * セルのタップでぼかし表示を切り替える（暗記用）。
 * highlight で指定されたセルは、符の行見出し・翻の列見出しとあわせて
 * クロスヘア状にハイライトし、初期表示時に画面中央へスクロールされる。
 * 配色は `_lib/table-highlight` が持つ（早見表と教本で同じ塗りを使うため）。
 * 頻出符の行見出しと同じ琥珀だが、あちらは文字色だけ・こちらは塗りつぶしで
 * 役割を分けている。
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
            <DataTableHeaderCell
              key={han}
              className={
                highlight?.han === han
                  ? TABLE_HIGHLIGHT_HEADER_CLASS
                  : undefined
              }
            >
              {han}
              {t("hanSuffix")}
            </DataTableHeaderCell>
          ))}
        </>
      }
    >
      {FU_ROWS.map((fu) => {
        const isFrequent = FREQUENT_FU.has(fu);
        const isFuHighlighted = highlight?.fu === fu;

        return (
          <tr key={fu} className="bg-white">
            <td
              className={`px-4 py-3 text-left font-medium ${
                isFuHighlighted
                  ? TABLE_HIGHLIGHT_HEADER_CLASS
                  : isFrequent
                    ? "text-amber-700"
                    : "text-surface-600"
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
                ? ` ${TABLE_HIGHLIGHT_FOCUS_CLASS}`
                : "";

              const interactiveClass =
                onToggleCell === undefined ? "" : " cursor-pointer select-none";

              return (
                <td
                  key={han}
                  ref={isHighlighted ? highlightRef : undefined}
                  className={`px-4 py-3${interactiveClass}${highlightClass}`}
                  onClick={
                    onToggleCell === undefined
                      ? undefined
                      : () => onToggleCell(cellId)
                  }
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
