"use client";

import { useTranslations } from "next-intl";
import { HIGH_SCORES } from "@mahjong-scoring/core";
import type { Role, WinType } from "@mahjong-scoring/core";
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
    <div className="overflow-hidden rounded-xl border border-surface-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50">
            <th className="px-4 py-3 text-left font-medium text-surface-600">
              {t("name")}
            </th>
            <th className="px-4 py-3 text-right font-medium text-surface-600">
              {t("hanSuffix")}
            </th>
            <th className="px-4 py-3 text-right font-medium text-surface-600">
              {t("score")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
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
                      <TsumoScore
                        payment={isKo ? item.tsumoKo : item.tsumoOya}
                      />
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
