"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  HIGH_SCORES,
} from "@mahjong-scoring/core";
import { ToggleGroup } from "@/app/_components/toggle-group";

type Role = "ko" | "oya";
type ViewMode = "normal" | "high_score";
type WinType = "ron" | "tsumo";

const HAN_COLS = [1, 2, 3, 4] as const;
const FU_ROWS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;

const FREQUENT_FU = new Set([30, 40]);

function TsumoScore({ score }: { readonly score: string | number }) {
  if (typeof score !== "string") return <>{score}</>;
  const text = score.replace("\u2200", "");
  if (text.includes("/")) {
    const [ko, oya] = text.split("/");
    return (
      <div className="flex flex-col items-center leading-tight">
        <span>{ko} /</span>
        <span>{oya}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center leading-tight">
      <span>{text}\u2200</span>
    </div>
  );
}

export function ScoreTable() {
  const t = useTranslations("scoreTable");
  const [activeTab, setActiveTab] = useState<Role>("ko");
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [winType, setWinType] = useState<WinType>("ron");
  const [hiddenCells, setHiddenCells] = useState<Record<string, boolean>>({});

  const isKo = activeTab === "ko";

  const toggleCell = useCallback((id: string) => {
    setHiddenCells((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const roleOptions = useMemo(
    (): readonly { readonly value: Role; readonly label: string }[] => [
      { value: "ko", label: t("ko") },
      { value: "oya", label: t("oya") },
    ],
    [t]
  );

  const winTypeOptions = useMemo(
    (): readonly { readonly value: WinType; readonly label: string }[] => [
      { value: "ron", label: t("ron") },
      { value: "tsumo", label: t("tsumo") },
    ],
    [t]
  );

  const viewModeOptions = useMemo(
    (): readonly { readonly value: ViewMode; readonly label: string }[] => [
      { value: "normal", label: t("fuHan") },
      { value: "high_score", label: `${t("mangan")}+` },
    ],
    [t]
  );

  return (
    <div className="w-full relative">
      {/* Controls */}
      <div className="sticky top-0 z-20 pb-3 mb-1">
        <div className="flex flex-nowrap gap-2 items-center justify-end">
          <ToggleGroup
            options={roleOptions}
            selected={activeTab}
            onChange={setActiveTab}
          />
          <ToggleGroup
            options={winTypeOptions}
            selected={winType}
            onChange={setWinType}
          />
          <ToggleGroup
            options={viewModeOptions}
            selected={viewMode}
            onChange={setViewMode}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        {viewMode === "normal" ? (
          <div className="overflow-hidden rounded-xl border border-surface-200">
            <table className="w-full text-center text-sm">
              <thead>
                <tr className="bg-surface-50">
                  <th className="px-4 py-3 text-left font-medium text-surface-600">
                    {t("fuSuffix")}\uFF3C{t("hanSuffix")}
                  </th>
                  {HAN_COLS.map((han) => (
                    <th key={han} className="px-4 py-3 font-medium text-surface-600">
                      {han}{t("hanSuffix")}
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
                        if (isInvalidCell(han, fu, winType)) {
                          return (
                            <td key={han} className="px-4 py-3 text-surface-400">
                              -
                            </td>
                          );
                        }

                        const score = isKo
                          ? calculateKoScore(han, fu)
                          : calculateOyaScore(han, fu);
                        const cellId = `${activeTab}-${winType}-${han}han-${fu}fu`;
                        const isHidden = !!hiddenCells[cellId];

                        if (score.isMangan) {
                          return (
                            <td
                              key={han}
                              className="px-4 py-3 cursor-pointer select-none"
                              onClick={() => toggleCell(cellId)}
                            >
                              <span
                                className={`font-semibold text-primary-600 ${
                                  isHidden ? "blur-md" : ""
                                }`}
                              >
                                {t("mangan")}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={han}
                            className="px-4 py-3 cursor-pointer select-none"
                            onClick={() => toggleCell(cellId)}
                          >
                            <span
                              className={`font-semibold text-primary-600 ${
                                isHidden ? "blur-md" : ""
                              }`}
                            >
                              {winType === "ron" ? (
                                score.ron
                              ) : (
                                <TsumoScore score={score.tsumo} />
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
        ) : (
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
                        {item.han}{t("hanSuffix")}
                      </td>
                      <td
                        className="px-4 py-3 text-right cursor-pointer select-none"
                        onClick={() => toggleCell(cellId)}
                      >
                        <span
                          className={`font-semibold text-primary-600 ${
                            isHidden ? "blur-md" : ""
                          }`}
                        >
                          {winType === "ron" ? (
                            isKo ? item.ronKo : item.ronOya
                          ) : (
                            <TsumoScore score={isKo ? item.tsumoKo : item.tsumoOya} />
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
