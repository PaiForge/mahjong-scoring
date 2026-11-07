"use client";

import { useTranslations } from "next-intl";

import type { HeatmapLayout } from "../_lib/heatmap-utils";
import { getExpLevel } from "../_lib/heatmap-utils";
import { LEVEL_CLASSES } from "../_lib/heatmap-level-classes";

interface HeatmapGridProps {
  readonly layout: HeatmapLayout;
  /** 日付キー（YYYY-MM-DD）→ EXP 量 */
  readonly daily: Readonly<Record<string, number>>;
  readonly selectedDate: string | undefined;
  readonly onCellClick: (dateStr: string) => void;
}

/**
 * デスクトップ向けの週×曜日 EXP ヒートマップグリッド
 * ヒートマップグリッド
 */
export function HeatmapGrid({
  layout,
  daily,
  selectedDate,
  onCellClick,
}: HeatmapGridProps) {
  const t = useTranslations("mypage.heatmap");

  const dayLabels: Partial<Record<number, string>> = {
    1: t("dayLabels.mon"),
    3: t("dayLabels.wed"),
    5: t("dayLabels.fri"),
  };

  return (
    <div
      className="inline-grid"
      style={{ gridTemplateColumns: "auto 1fr" }}
      role="grid"
      aria-label={t("gridAriaLabel")}
    >
      <div />
      <div className="flex gap-[3px]">
        {layout.weeks.map((_, weekIdx) => {
          const monthLabel = layout.monthLabels.find(
            (m) => m.weekIdx === weekIdx,
          );
          return (
            <div
              key={weekIdx}
              className="size-3 text-xs text-surface-500 leading-none"
              aria-hidden="true"
            >
              {monthLabel ? monthLabel.label : ""}
            </div>
          );
        })}
      </div>

      {Array.from({ length: 7 }, (_, dayIdx) => (
        <div key={dayIdx} className="contents">
          <div
            className="flex h-3 items-center pr-1.5 text-xs text-surface-500 leading-none"
            aria-hidden="true"
          >
            {dayLabels[dayIdx] ?? ""}
          </div>
          <div className="flex gap-[3px]" role="row">
            {layout.weeks.map((week, weekIdx) => {
              const dateStr = week[dayIdx];
              if (dateStr === null || dateStr === undefined) {
                return (
                  <div
                    key={`empty-${weekIdx}`}
                    className="size-3 rounded-sm"
                    aria-hidden="true"
                  />
                );
              }

              const amount = daily[dateStr] ?? 0;
              const level = getExpLevel(amount, layout.maxAmount);
              const levelClass = LEVEL_CLASSES[level] ?? LEVEL_CLASSES[0];
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={dateStr}
                  type="button"
                  role="gridcell"
                  aria-label={t("cellAriaLabel", { date: dateStr, amount })}
                  aria-selected={isSelected}
                  className={`size-3 rounded-sm ${levelClass} ${
                    isSelected ? "ring-2 ring-surface-900" : ""
                  } cursor-pointer`}
                  onClick={() => onCellClick(dateStr)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
