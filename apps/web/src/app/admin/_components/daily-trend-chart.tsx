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

  if (data.length === 0) {
    return <div className={CHART_EMPTY_CLASS}>{emptyMessage}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300} minHeight={250}>
      <LineChart data={mutableData} margin={CHART_MARGIN}>
        <CartesianGrid
          strokeDasharray={CHART_GRID_DASH}
          stroke={CHART_GRID_STROKE}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={CHART_AXIS_TICK}
          stroke={CHART_GRID_STROKE}
        />
        <YAxis
          allowDecimals={false}
          tick={CHART_AXIS_TICK}
          stroke={CHART_GRID_STROKE}
        />
        <Tooltip contentStyle={CHART_TOOLTIP_CONTENT_STYLE} />
        <Line
          type="monotone"
          dataKey="count"
          name={seriesLabel}
          stroke={CHART_PRIMARY_STROKE}
          strokeWidth={2}
          dot={CHART_PRIMARY_DOT}
          activeDot={CHART_PRIMARY_ACTIVE_DOT}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
