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

  const cellBase =
    "border border-surface-300 p-2 relative h-14 align-middle cursor-pointer select-none transition-colors";

  return (
    <div className="w-full relative">
      {/* Controls */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm pb-3 mb-1">
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
          <table className="w-full text-center border-collapse border border-surface-300 bg-white shadow-sm rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="bg-surface-600 text-white border border-surface-300 w-14 py-2 text-xs font-medium">
                  {t("fuSuffix")}＼{t("hanSuffix")}
                </th>
                {HAN_COLS.map((han) => (
                  <th
                    key={han}
                    className="bg-surface-600 text-white border border-surface-300 py-2 text-lg font-bold"
                  >
                    {han}
                    <span className="text-xs font-normal ml-0.5">{t("hanSuffix")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FU_ROWS.map((fu, idx) => {
                const isFrequent = FREQUENT_FU.has(fu);
                const rowBg = isFrequent
                  ? "bg-amber-50/60 hover:bg-amber-100/60"
                  : idx % 2 === 0
                    ? "bg-surface-50/50 hover:bg-surface-100/50"
                    : "bg-white hover:bg-surface-50/50";

                return (
                  <tr key={fu} className={rowBg}>
                    <td
                      className={`border border-surface-300 text-sm py-1 font-medium ${
                        isFrequent
                          ? "bg-amber-100 text-amber-800"
                          : "bg-surface-200 text-surface-600"
                      }`}
                    >
                      {fu}
                    </td>
                    {HAN_COLS.map((han) => {
                      if (isInvalidCell(han, fu, winType)) {
                        return (
                          <td
                            key={han}
                            className="border border-surface-300 text-surface-400 bg-surface-100/50 h-14"
                          >
                            <div className="text-surface-400 text-sm">-</div>
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
                            className={`border border-surface-300 p-1 cursor-pointer transition-colors select-none relative h-14 ${
                              isHidden ? "bg-surface-200" : "bg-primary-100 hover:bg-primary-200"
                            }`}
                            onClick={() => toggleCell(cellId)}
                          >
                            <div
                              className={`flex items-center justify-center h-full text-sm font-bold text-primary-700 ${
                                isHidden ? "blur-md" : ""
                              }`}
                            >
                              {t("mangan")}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={han}
                          className={`${cellBase} ${isHidden ? "bg-surface-200" : "bg-transparent"}`}
                          onClick={() => toggleCell(cellId)}
                        >
                          <div
                            className={`text-surface-800 text-sm font-medium ${
                              winType === "tsumo"
                                ? "flex items-center justify-center h-full"
                                : ""
                            } ${isHidden ? "blur-md" : ""}`}
                          >
                            {winType === "ron" ? score.ron : <TsumoScore score={score.tsumo} />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-center border-collapse border border-surface-300 bg-white shadow-sm rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="bg-surface-600 text-white border border-surface-300 py-2 font-medium">
                  {t("name")}
                </th>
                <th className="bg-surface-600 text-white border border-surface-300 py-2 font-medium">
                  {t("hanSuffix")}
                </th>
                <th className="bg-surface-600 text-white border border-surface-300 py-2 font-medium">
                  {t("score")}
                </th>
              </tr>
            </thead>
            <tbody>
              {HIGH_SCORES.map((item, idx) => {
                const cellId = `${activeTab}-${winType}-${item.nameKey}`;
                const isHidden = !!hiddenCells[cellId];
                const isYakuman = item.nameKey === "yakuman";
                const rowBg = isYakuman
                  ? "bg-purple-50 hover:bg-purple-100"
                  : idx % 2 === 0
                    ? "bg-surface-50/50 hover:bg-surface-100/50"
                    : "bg-white hover:bg-surface-50/50";

                return (
                  <tr key={item.nameKey} className={rowBg}>
                    <td
                      className={`border border-surface-300 text-sm py-3 font-medium ${
                        isYakuman
                          ? "bg-purple-100 text-purple-800"
                          : "bg-primary-100 text-primary-800"
                      }`}
                    >
                      {t(item.nameKey)}
                    </td>
                    <td className="border border-surface-300 font-medium text-surface-600 text-sm">
                      {item.han}
                      {t("hanSuffix")}
                    </td>
                    <td
                      className={`${cellBase} ${isHidden ? "bg-surface-200" : "bg-transparent"}`}
                      onClick={() => toggleCell(cellId)}
                    >
                      <div
                        className={`text-surface-800 text-sm font-medium ${
                          winType === "tsumo"
                            ? "flex items-center justify-center h-full"
                            : ""
                        } ${isHidden ? "blur-md" : ""}`}
                      >
                        {winType === "ron" ? (
                          isKo ? item.ronKo : item.ronOya
                        ) : (
                          <TsumoScore score={isKo ? item.tsumoKo : item.tsumoOya} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
