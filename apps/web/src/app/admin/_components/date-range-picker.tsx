"use client";

import { parseAsString, useQueryStates } from "nuqs";

import { daysAgo, today } from "@/app/admin/_lib/dashboard/date-utils";
import { ADMIN_INPUT_CLASSES } from "../_lib/input-classes";

interface DateRangePickerProps {
  readonly startDate: string;
  readonly endDate: string;
  readonly labels: {
    readonly from: string;
    readonly to: string;
    readonly presets: string;
    readonly past7days: string;
    readonly past28days: string;
    readonly past90days: string;
  };
}

/**
 * ダッシュボードの集計期間を選ぶ日付レンジピッカー。
 * 期間は URL クエリ（from / to）に保持し、サーバー側で再集計する。
 * 期間ピッカー
 */
export function DateRangePicker({
  startDate,
  endDate,
  labels,
}: DateRangePickerProps) {
  // 既定値・上限・プリセットで同じ「今日」を使うため、ここで1回だけ解決する
  const now = new Date();

  const [, setParams] = useQueryStates(
    {
      from: parseAsString.withDefault(daysAgo(28, now)),
      to: parseAsString.withDefault(today(now)),
    },
    { shallow: false },
  );

  const presets = [
    { label: labels.past7days, days: 7 },
    { label: labels.past28days, days: 28 },
    { label: labels.past90days, days: 90 },
  ] as const;

  return (
    <div className="admin-filter flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="date-from" className="w-12 text-sm text-surface-500">
          {labels.from}
        </label>
        <input
          id="date-from"
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => setParams({ from: e.target.value })}
          className={`w-40 ${ADMIN_INPUT_CLASSES}`}
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="date-to" className="w-12 text-sm text-surface-500">
          {labels.to}
        </label>
        <input
          id="date-to"
          type="date"
          value={endDate}
          min={startDate}
          max={today(now)}
          onChange={(e) => setParams({ to: e.target.value })}
          className={`w-40 ${ADMIN_INPUT_CLASSES}`}
        />
      </div>
      <div
        role="group"
        aria-label={labels.presets}
        className="flex rounded-lg border border-surface-300 bg-white p-0.5"
      >
        {presets.map((preset) => {
          const presetFrom = daysAgo(preset.days, now);
          const presetTo = today(now);
          const isActive = startDate === presetFrom && endDate === presetTo;

          return (
            <button
              key={preset.days}
              type="button"
              onClick={() => setParams({ from: presetFrom, to: presetTo })}
              aria-pressed={isActive}
              className={`h-8 w-20 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-surface-500 hover:bg-surface-100 hover:text-surface-900"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
