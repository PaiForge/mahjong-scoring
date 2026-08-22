"use client";

import { useTranslations } from "next-intl";
import { HIGH_SCORES } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";
import {
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { TsumoScore } from "./tsumo-score";

interface HighScoreTableProps {
  readonly activeTab: Role;
  readonly winType: WinType;
  readonly hiddenCells: Readonly<Record<string, boolean>>;
  readonly onToggleCell: (id: string) => void;
}

/**
 * 満貫以上の点数表（種類×翻数×点数）
 * 高打点点数表
 *
 * セルのタップでぼかし表示を切り替える（暗記用）。
 */
export function HighScoreTable({
  activeTab,
  winType,
  hiddenCells,
  onToggleCell,
}: HighScoreTableProps) {
  const t = useTranslations("scoreTable");
  const isKo = activeTab === "ko";

  return (
    <DataTable
      header={
        <>
          <DataTableHeaderCell align="left">{t("name")}</DataTableHeaderCell>
          <DataTableHeaderCell align="right">
            {t("hanSuffix")}
          </DataTableHeaderCell>
          <DataTableHeaderCell align="right">{t("score")}</DataTableHeaderCell>
        </>
      }
    >
      {HIGH_SCORES.map((item) => {
        const cellId = `${activeTab}-${winType}-${item.nameKey}`;
        const isHidden = !!hiddenCells[cellId];

        return (
          <tr key={item.nameKey} className="bg-white">
            <td className="px-4 py-3 text-surface-900 font-medium">
              {t(item.nameKey)}
            </td>
            <td className="px-4 py-3 text-right text-surface-600">
              {item.han}
              {t("hanSuffix")}
            </td>
            <td
              className="px-4 py-3 text-right cursor-pointer select-none"
              onClick={() => onToggleCell(cellId)}
            >
              <span
                className={`font-semibold text-primary-600 ${
                  isHidden ? "blur-md" : ""
                }`}
              >
                {winType === "ron" ? (
                  isKo ? (
                    item.ronKo
                  ) : (
                    item.ronOya
                  )
                ) : (
                  <TsumoScore payment={isKo ? item.tsumoKo : item.tsumoOya} />
                )}
              </span>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
