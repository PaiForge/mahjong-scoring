"use client";

import { useTranslations } from "next-intl";
import { formatJstDayKeyMonthDay } from "@mahjong-scoring/features/jst";

import type { HeatmapLayout } from "../_lib/heatmap-utils";

const BAR_CHART_HEIGHT_PX = 140;
const BAR_CHART_MIN_HEIGHT_PX = 4;

interface HeatmapBarChartProps {
  readonly layout: HeatmapLayout;
  /** 日付キー（YYYY-MM-DD）→ EXP 量 */
  readonly daily: Readonly<Record<string, number>>;
  readonly selectedDate: string | undefined;
  readonly onCellClick: (dateStr: string) => void;
}

/**
 * モバイル向けの直近7日間 EXP バーチャート
 * ヒートマップバーチャート
 */
export function HeatmapBarChart({
  layout,
  daily,
  selectedDate,
  onCellClick,
}: HeatmapBarChartProps) {
  const t = useTranslations("mypage.heatmap");

  const maxAmount = Math.max(0, ...layout.recentDays.map((d) => daily[d] ?? 0));

  return (
    <div
      className="flex items-end gap-2"
      style={{ height: `${BAR_CHART_HEIGHT_PX}px` }}
      role="group"
      aria-label={t("barChartAriaLabel")}
    >
      {layout.recentDays.map((dateStr) => {
        const amount = daily[dateStr] ?? 0;
        const ratio = maxAmount > 0 ? amount / maxAmount : 0;
        const barHeight =
          amount > 0
            ? Math.max(
                BAR_CHART_MIN_HEIGHT_PX,
                Math.round(ratio * (BAR_CHART_HEIGHT_PX - 24)),
              )
            : BAR_CHART_MIN_HEIGHT_PX;
        const isSelected = dateStr === selectedDate;
        const dateLabel = formatJstDayKeyMonthDay(dateStr);

        return (
          <div
            key={dateStr}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="text-xs text-surface-500">{amount}</span>
            <button
              type="button"
              aria-label={t("cellAriaLabel", { date: dateStr, amount })}
              aria-selected={isSelected}
              className={`w-full rounded-t bg-primary-600 cursor-pointer ${
                isSelected ? "ring-2 ring-surface-900" : ""
              }`}
              style={{ height: `${barHeight}px` }}
              onClick={() => onCellClick(dateStr)}
            />
            <span className="text-xs text-surface-500">{dateLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
