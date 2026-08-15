"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Props as LegendProps } from "recharts/types/component/DefaultLegendContent";

import {
  CHART_AXIS_TICK,
  CHART_EMPTY_CLASS,
  CHART_GRID_DASH,
  CHART_GRID_STROKE,
  CHART_MARGIN,
  CHART_PRIMARY_ACTIVE_DOT,
  CHART_PRIMARY_DOT,
  CHART_PRIMARY_STROKE,
  CHART_TOOLTIP_CONTENT_STYLE,
} from "@/app/_lib/chart-theme";

interface DataPoint {
  readonly date: string;
  readonly dateKey: string;
  readonly score: number | undefined;
  readonly previousScore: number | undefined;
}

interface ScoreChartProps {
  readonly data: readonly DataPoint[];
  readonly emptyMessage: string;
  readonly yAxisLabel: string;
  readonly currentLabel: string;
  readonly previousLabel: string;
  readonly onPreviousLabelClick?: () => void;
}

/**
 * スコア推移の折れ線チャート。現在期間と前期間を重ねて表示する。
 * スコアチャート
 */
export function ScoreChart({
  data,
  emptyMessage,
  yAxisLabel,
  currentLabel,
  previousLabel,
  onPreviousLabelClick,
}: ScoreChartProps) {
  const hasPreviousData = data.some((d) => d.previousScore !== undefined);

  const mutableData = useMemo(() => [...data], [data]);

  const yAxisLabelConfig = useMemo(
    () => ({
      ...CHART_AXIS_TICK,
      value: yAxisLabel,
      angle: -90,
      position: "insideLeft" as const,
    }),
    [yAxisLabel],
  );

  if (data.length === 0) {
    return <div className={CHART_EMPTY_CLASS}>{emptyMessage}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={250} minHeight={200}>
      <LineChart data={mutableData} margin={CHART_MARGIN}>
        <CartesianGrid
          strokeDasharray={CHART_GRID_DASH}
          stroke={CHART_GRID_STROKE}
        />
        <XAxis
          dataKey="date"
          tick={CHART_AXIS_TICK}
          stroke={CHART_GRID_STROKE}
        />
        <YAxis
          tick={CHART_AXIS_TICK}
          stroke={CHART_GRID_STROKE}
          label={yAxisLabelConfig}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
          formatter={(value, name) => {
            if (value === undefined || value === null) return ["-", name ?? ""];
            const num = typeof value === "number" ? value : Number(value);
            const label =
              name === "previousScore" ? previousLabel : currentLabel;
            return [num.toFixed(1), label];
          }}
        />
        {hasPreviousData && (
          <Legend
            content={({ payload }: LegendProps) => {
              if (!payload || payload.length === 0) return null;
              return (
                <div className="flex justify-center gap-6 text-xs mt-1">
                  {payload.map((entry) => {
                    const isClickable =
                      entry.dataKey === "previousScore" &&
                      !!onPreviousLabelClick;
                    return (
                      <span
                        key={String(entry.dataKey)}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        className={
                          isClickable
                            ? "cursor-pointer hover:underline select-none"
                            : "select-none"
                        }
                        onClick={isClickable ? onPreviousLabelClick : undefined}
                        onKeyDown={
                          isClickable
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onPreviousLabelClick?.();
                                }
                              }
                            : undefined
                        }
                      >
                        <span
                          className="inline-block w-3 h-[2px] align-middle mr-1"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.value}
                      </span>
                    );
                  })}
                </div>
              );
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="score"
          name={currentLabel}
          stroke={CHART_PRIMARY_STROKE}
          strokeWidth={2}
          dot={CHART_PRIMARY_DOT}
          activeDot={CHART_PRIMARY_ACTIVE_DOT}
          connectNulls
        />
        {hasPreviousData && (
          <Line
            type="monotone"
            dataKey="previousScore"
            name={previousLabel}
            stroke="var(--color-surface-400)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={{ fill: "var(--color-surface-400)", r: 2 }}
            activeDot={{ fill: "var(--color-surface-400)", r: 4 }}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
