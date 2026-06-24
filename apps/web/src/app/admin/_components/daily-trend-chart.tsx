"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyCount } from "@/app/admin/_lib/dashboard/aggregate-by-day";

interface DailyTrendChartProps {
  readonly data: readonly DailyCount[];
  readonly seriesLabel: string;
  readonly emptyMessage: string;
}

/** YYYY-MM-DD を MM/DD 表示に整形する。 */
function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

/**
 * 新規ユーザー数の日次推移を描く折れ線チャート。
 * 日次推移チャート
 */
export function DailyTrendChart({
  data,
  seriesLabel,
  emptyMessage,
}: DailyTrendChartProps) {
  const mutableData = useMemo(() => [...data], [data]);

  const chartMargin = useMemo(
    () => ({ top: 5, right: 10, left: 0, bottom: 5 }),
    [],
  );

  const axisTick = useMemo(
    () => ({ fill: "var(--color-surface-500)", fontSize: 12 }),
    [],
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
      <div className="flex h-48 items-center justify-center text-sm text-surface-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <LineChart data={mutableData} margin={chartMargin}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-surface-200)"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={axisTick}
          stroke="var(--color-surface-200)"
        />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          stroke="var(--color-surface-200)"
        />
        <Tooltip contentStyle={tooltipContentStyle} />
        <Line
          type="monotone"
          dataKey="count"
          name={seriesLabel}
          stroke="var(--color-primary-500)"
          strokeWidth={2}
          dot={{ fill: "var(--color-primary-500)", r: 3 }}
          activeDot={{ fill: "var(--color-primary-500)", r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
