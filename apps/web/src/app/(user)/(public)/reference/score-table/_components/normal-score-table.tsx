"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import type { Role, RoleScore, WinType } from "@mahjong-scoring/core";
import {
  DataTable,
  DataTableHeaderCell,
  DATA_TABLE_CELL_PADDING,
} from "@/app/(user)/_components/data-table";
import {
  TABLE_HIGHLIGHT_FOCUS_CLASS,
  TABLE_HIGHLIGHT_HEADER_CLASS,
} from "@/app/(user)/_components/_lib/table-highlight";
import {
  HAN_COLS,
  FU_ROWS,
  SCORE_TABLE_FU_COLUMN_CLASS,
} from "../_lib/score-table-utils";
import type { NormalCellHighlight } from "../_lib/score-table-utils";
import { TsumoScore } from "./tsumo-score";

const FREQUENT_FU = new Set([30, 40]);

interface NormalScoreTableProps {
  /** `${han}-${fu}` → 点数計算結果のグリッド */
  readonly scoreGrid: ReadonlyMap<string, RoleScore>;
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
 * 頻出符（30・40符）の行見出しは太字で示す。色で示すと、表の中に「注目」の
 * 合図が2種類あることになり、ハイライトと見分けが付かなくなる。
 *
 * 列幅は `table-fixed` で決め打ちし、翻の 4 列を等幅にする。どの列も同じ
 * 種類の値（点数）を持つのに、中身なりに決まる auto レイアウトでは桁数で
 * 幅が割れ、しかも 子/親・ロン/ツモ を切り替えるたびに全列が組み替わって
 * いた（desktop 実測で 子ロンの 164/152/152/152/152 が 親ロンでは
 * 152/141/159/159/159）。暗記のために同じセルを何度も見に来る表で、
 * タップのたびに数字の居場所が変わってしまう。符の列だけ幅を与え
 * （`table-fixed` は幅を指定していない列に残りを均等に配る）、
 * 見出しの「符＼翻」が折り返さない最小限に取る。
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
      tableClassName="table-fixed text-center"
      header={
        <>
          <DataTableHeaderCell
            align="left"
            density="dense"
            className={SCORE_TABLE_FU_COLUMN_CLASS}
          >
            {t("fuSuffix")}
            {"＼"}
            {t("hanSuffix")}
          </DataTableHeaderCell>
          {HAN_COLS.map((han) => (
            <DataTableHeaderCell
              key={han}
              density="dense"
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
              // 太さは頻出符かどうかだけで決め、塗りはハイライトかどうかだけで
              // 決める。1つの三項に混ぜると、ハイライトされた頻出符が頻出の
              // 印を失う（40符はその両方に当たる）。
              className={[
                DATA_TABLE_CELL_PADDING.dense,
                "text-left",
                isFrequent ? "font-bold text-surface-900" : "font-medium",
                isFuHighlighted
                  ? TABLE_HIGHLIGHT_HEADER_CLASS
                  : isFrequent
                    ? ""
                    : "text-surface-600",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {fu}
            </td>
            {HAN_COLS.map((han) => {
              const score = scoreGrid.get(`${han}-${fu}`);
              if (!score) {
                return (
                  <td
                    key={han}
                    className={`${DATA_TABLE_CELL_PADDING.dense} text-surface-400`}
                  >
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
                  className={`${DATA_TABLE_CELL_PADDING.dense}${interactiveClass}${highlightClass}`}
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
