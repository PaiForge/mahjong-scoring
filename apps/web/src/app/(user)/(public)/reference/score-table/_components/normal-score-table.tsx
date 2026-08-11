"use client";

import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import type { calculateKoScore } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";
import { TsumoScore } from "./tsumo-score";

/** 表の翻数列（1〜4翻） */
export const HAN_COLS = [1, 2, 3, 4] as const;
/** 表の符行（20〜110符） */
export const FU_ROWS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;

const FREQUENT_FU = new Set([30, 40]);

interface NormalScoreTableProps {
  /** `${han}-${fu}` → 点数計算結果のグリッド */
  readonly scoreGrid: ReadonlyMap<string, ReturnType<typeof calculateKoScore>>;
  readonly activeTab: Role;
  readonly winType: WinType;
  readonly hiddenCells: Readonly<Record<string, boolean>>;
  readonly highlightCellId: string | undefined;
  readonly highlightRef: RefObject<HTMLTableCellElement | null>;
  readonly onToggleCell: (id: string) => void;
}

/**
 * 満貫未満の符×翻 点数表
 * 通常点数表
 *
 * セルのタップでぼかし表示を切り替える（暗記用）。
 * クエリ指定されたセルはハイライトし、初期表示時に画面中央へスクロールされる。
 */
export function NormalScoreTable({
  scoreGrid,
  activeTab,
  winType,
  hiddenCells,
  highlightCellId,
  highlightRef,
  onToggleCell,
}: NormalScoreTableProps) {
  const t = useTranslations("scoreTable");

  return (
    <div className="overflow-hidden rounded-xl border border-surface-200">
      <table className="w-full text-center text-sm">
        <thead>
          <tr className="bg-surface-50">
            <th className="px-4 py-3 text-left font-medium text-surface-600">
              {t("fuSuffix")}
              {"＼"}
              {t("hanSuffix")}
            </th>
            {HAN_COLS.map((han) => (
              <th key={han} className="px-4 py-3 font-medium text-surface-600">
                {han}
                {t("hanSuffix")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
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
                  const isHighlighted = cellId === highlightCellId;
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
        </tbody>
      </table>
    </div>
  );
}
