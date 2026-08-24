"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  isRole,
  isWinType,
} from "@mahjong-scoring/core";
import { ToggleGroup } from "@/app/(user)/_components/toggle-group";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { buildHighlightCellId } from "../_lib/score-table-utils";
import type { Role, WinType } from "@mahjong-scoring/core";
import { HAN_COLS, FU_ROWS, NormalScoreTable } from "./normal-score-table";
import { HighScoreTable } from "./high-score-table";
import { KiriageManganNote } from "./kiriage-mangan-note";

type ViewMode = "normal" | "high_score";

/**
 * 点数早見表のコンテナ
 * 点数早見表
 *
 * 親子・ツモロン・表示モードの切り替え状態と点数グリッドの計算を持ち、
 * 表本体の描画は NormalScoreTable / HighScoreTable に委譲する。
 */
export function ScoreTable() {
  const t = useTranslations("scoreTable");
  const searchParams = useSearchParams();
  const highlightRef = useRef<HTMLTableCellElement>(null);

  const paramRole = searchParams.get("role");
  const paramWinType = searchParams.get("winType");
  const paramHan = searchParams.get("han");
  const paramFu = searchParams.get("fu");

  const initialRole: Role =
    paramRole !== null && isRole(paramRole) ? paramRole : "ko";
  const initialWinType: WinType =
    paramWinType !== null && isWinType(paramWinType) ? paramWinType : "ron";

  const highlightCellId = useMemo(
    () =>
      buildHighlightCellId({
        role: paramRole,
        winType: paramWinType,
        han: paramHan,
        fu: paramFu,
      }),
    [paramRole, paramWinType, paramHan, paramFu],
  );

  const [activeTab, setActiveTab] = useState<Role>(initialRole);
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [winType, setWinType] = useState<WinType>(initialWinType);
  const [hiddenCells, setHiddenCells] = useState<Record<string, boolean>>({});

  const isKo = activeTab === "ko";
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);

  /** 符・翻の点数計算結果グリッド（activeTab / winType / 切り上げ満貫設定に依存） */
  const scoreGrid = useMemo(() => {
    const grid = new Map<string, ReturnType<typeof calculateKoScore>>();
    for (const fu of FU_ROWS) {
      for (const han of HAN_COLS) {
        if (!isInvalidCell(han, fu, winType)) {
          const key = `${han}-${fu}`;
          grid.set(
            key,
            isKo
              ? calculateKoScore(han, fu, { kiriageMangan })
              : calculateOyaScore(han, fu, { kiriageMangan }),
          );
        }
      }
    }
    return grid;
  }, [isKo, winType, kiriageMangan]);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  const toggleCell = useCallback((id: string) => {
    setHiddenCells((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const roleOptions = useMemo(
    (): readonly { readonly value: Role; readonly label: string }[] => [
      { value: "ko", label: t("ko") },
      { value: "oya", label: t("oya") },
    ],
    [t],
  );

  const winTypeOptions = useMemo(
    (): readonly { readonly value: WinType; readonly label: string }[] => [
      { value: "ron", label: t("ron") },
      { value: "tsumo", label: t("tsumo") },
    ],
    [t],
  );

  const viewModeOptions = useMemo(
    (): readonly { readonly value: ViewMode; readonly label: string }[] => [
      { value: "normal", label: t("fuHan") },
      { value: "high_score", label: `${t("mangan")}+` },
    ],
    [t],
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
          <NormalScoreTable
            scoreGrid={scoreGrid}
            activeTab={activeTab}
            winType={winType}
            hiddenCells={hiddenCells}
            highlightCellId={highlightCellId}
            highlightRef={highlightRef}
            onToggleCell={toggleCell}
          />
        ) : (
          <HighScoreTable
            activeTab={activeTab}
            winType={winType}
            hiddenCells={hiddenCells}
            onToggleCell={toggleCell}
          />
        )}
      </div>

      {/* 切り上げ満貫が動かすのは符×翻の表だけなので、満貫+ の表では出さない */}
      {kiriageMangan && viewMode === "normal" && (
        <div className="mt-4">
          <KiriageManganNote />
        </div>
      )}
    </div>
  );
}
