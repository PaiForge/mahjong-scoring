"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Role = "ko" | "oya";
type ViewMode = "normal" | "high_score";
type WinType = "ron" | "tsumo";

const HAN_COLS = [1, 2, 3, 4] as const;
const FU_ROWS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;

const FREQUENT_FU = new Set([30, 40]);

function calculateKoScore(han: number, fu: number) {
  const base = fu * Math.pow(2, 2 + han);
  if (base >= 2000) {
    return { isMangan: true, ron: 8000, tsumo: "2000/4000" } as const;
  }
  const ron = Math.ceil((base * 4) / 100) * 100;
  const tsumoKo = Math.ceil((base * 1) / 100) * 100;
  const tsumoOya = Math.ceil((base * 2) / 100) * 100;
  return { isMangan: false, ron, tsumo: `${tsumoKo}/${tsumoOya}` } as const;
}

function calculateOyaScore(han: number, fu: number) {
  const base = fu * Math.pow(2, 2 + han);
  if (base >= 2000) {
    return { isMangan: true, ron: 12000, tsumo: "4000∀" } as const;
  }
  const ron = Math.ceil((base * 6) / 100) * 100;
  const tsumo = Math.ceil((base * 2) / 100) * 100;
  return { isMangan: false, ron, tsumo: `${tsumo}∀` } as const;
}

const HIGH_SCORES = [
  { nameKey: "mangan", han: "5", ronKo: 8000, tsumoKo: "2000/4000", ronOya: 12000, tsumoOya: "4000" },
  { nameKey: "haneman", han: "6-7", ronKo: 12000, tsumoKo: "3000/6000", ronOya: 18000, tsumoOya: "6000" },
  { nameKey: "baiman", han: "8-10", ronKo: 16000, tsumoKo: "4000/8000", ronOya: 24000, tsumoOya: "8000" },
  { nameKey: "sanbaiman", han: "11-12", ronKo: 24000, tsumoKo: "6000/12000", ronOya: 36000, tsumoOya: "12000" },
  { nameKey: "yakuman", han: "13~", ronKo: 32000, tsumoKo: "8000/16000", ronOya: 48000, tsumoOya: "16000" },
] as const;

function isInvalidCell(han: number, fu: number, winType: WinType): boolean {
  return (
    (han === 1 && fu === 20) ||
    (winType === "ron" && fu === 20) ||
    (han === 1 && fu === 25) ||
    (winType === "tsumo" && han === 2 && fu === 25)
  );
}

function TsumoScore({ score }: { readonly score: string | number }) {
  if (typeof score !== "string") return <>{score}</>;
  const text = score.replace("∀", "");
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
      <span>{text}∀</span>
    </div>
  );
}

interface ToggleGroupProps<T extends string> {
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly selected: T;
  readonly onChange: (value: T) => void;
}

function ToggleGroup<T extends string>({ options, selected, onChange }: ToggleGroupProps<T>) {
  return (
    <div className="flex rounded-md border border-primary-200 bg-primary-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
            selected === opt.value
              ? "bg-primary-600 text-white"
              : "text-surface-700 hover:bg-surface-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
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

  const toggleCell = (id: string) => {
    setHiddenCells((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full relative">
      {/* Controls */}
      <div className="sticky top-0 z-20 pb-3 mb-1">
        <div className="flex flex-nowrap gap-2 items-center justify-end">
          <ToggleGroup
            options={[
              { value: "ko", label: t("ko") },
              { value: "oya", label: t("oya") },
            ]}
            selected={activeTab}
            onChange={setActiveTab}
          />
          <ToggleGroup
            options={[
              { value: "ron", label: t("ron") },
              { value: "tsumo", label: t("tsumo") },
            ]}
            selected={winType}
            onChange={setWinType}
          />
          <ToggleGroup
            options={[
              { value: "normal", label: t("fuHan") },
              { value: "high_score", label: `${t("mangan")}+` },
            ]}
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
                    {t("fuSuffix")}＼{t("hanSuffix")}
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
