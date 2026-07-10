"use client";

import { useCallback, useState } from "react";

import { useTranslations } from "next-intl";

import type { ExpHeatmapData } from "@/lib/db/get-exp-heatmap-data";

import type { HeatmapLayout } from "../_lib/heatmap-utils";
import { LEVEL_CLASSES } from "../_lib/heatmap-level-classes";
import { HeatmapGrid } from "./heatmap-grid";
import { HeatmapBarChart } from "./heatmap-bar-chart";
import { HeatmapDetailPanel } from "./heatmap-detail-panel";

interface Props {
  readonly data: ExpHeatmapData;
  readonly layout: HeatmapLayout;
}

/**
 * EXP アクティビティヒートマップのコンテナ
 * EXPヒートマップ
 *
 * 選択日の状態を持ち、デスクトップのグリッド・モバイルのバーチャート・
 * 凡例・詳細パネルを組み合わせる。
 */
export function ExpActivityHeatmap({ data, layout }: Props) {
  const t = useTranslations("mypage.heatmap");
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined,
  );

  const handleCellClick = useCallback((dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? undefined : dateStr));
  }, []);

  // 空状態判定: 0 のエントリしか無いケースも空として扱う。
  const hasAnyActivity = Object.values(data.daily).some((v) => v > 0);

  const moduleBreakdown = selectedDate
    ? data.dailyByModule[selectedDate]
    : undefined;
  const selectedTotal = selectedDate ? (data.daily[selectedDate] ?? 0) : 0;

  return (
    <div className="space-y-3">
      {/* デスクトップ: 46 週ヒートマップ */}
      <div className="hidden overflow-x-auto md:flex md:justify-center">
        <HeatmapGrid
          layout={layout}
          daily={data.daily}
          selectedDate={selectedDate}
          onCellClick={handleCellClick}
        />
      </div>
      {/* モバイル: 直近 7 日間のバーチャート */}
      <div className="block md:hidden">
        <HeatmapBarChart
          layout={layout}
          daily={data.daily}
          selectedDate={selectedDate}
          onCellClick={handleCellClick}
        />
      </div>

      {/* 空状態メッセージ */}
      {!hasAnyActivity && (
        <p className="text-sm text-surface-500">{t("empty")}</p>
      )}

      {/* レジェンド — デスクトップのみ */}
      <div
        className="hidden items-center justify-end text-xs text-surface-500 md:flex"
        aria-label={t("legendAriaLabel")}
      >
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span>{t("less")}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`size-3 rounded-sm ${LEVEL_CLASSES[level]}`}
            />
          ))}
          <span>{t("more")}</span>
        </div>
      </div>

      {/* 選択日の詳細パネル（常にマウントし aria-live で読み上げ） */}
      <HeatmapDetailPanel
        selectedDate={selectedDate}
        selectedTotal={selectedTotal}
        moduleBreakdown={moduleBreakdown}
      />
    </div>
  );
}
