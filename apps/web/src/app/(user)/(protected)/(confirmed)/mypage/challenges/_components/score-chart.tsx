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

  const chartMargin = useMemo(
    () => ({ top: 5, right: 10, left: 0, bottom: 5 }),
    [],
  );

  const axisTick = useMemo(
    () => ({ fill: "var(--color-surface-500)", fontSize: 12 }),
    [],
  );

  const yAxisLabelConfig = useMemo(
    () => ({
      value: yAxisLabel,
      angle: -90,
      position: "insideLeft" as const,
      fill: "var(--color-surface-500)",
      fontSize: 12,
    }),
    [yAxisLabel],
  );

  const tooltipContentStyle = useMemo(
    () => ({
      backgroundColor: "var(--color-surface-50)",
      border: "1px solid var(--color-surface-200)",
      borderRadius: "8px",
      color: "var(--color-surface-900)",
    }),
    [],
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-surface-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250} minHeight={200}>
      <LineChart
        data={mutableData}
        margin={chartMargin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
        <XAxis
          dataKey="date"
          tick={axisTick}
          stroke="var(--color-surface-200)"
        />
        <YAxis
          tick={axisTick}
          stroke="var(--color-surface-200)"
          label={yAxisLabelConfig}
        />
        <Tooltip
          contentStyle={tooltipContentStyle}
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
                        onClick={
                          isClickable ? onPreviousLabelClick : undefined
                        }
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
          stroke="var(--color-primary-500)"
          strokeWidth={2}
          dot={{ fill: "var(--color-primary-500)", r: 3 }}
          activeDot={{ fill: "var(--color-primary-500)", r: 5 }}
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
