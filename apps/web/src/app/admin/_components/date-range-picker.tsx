"use client";

import { parseAsString, useQueryStates } from "nuqs";

import { daysAgo, today } from "@/app/admin/_lib/dashboard";

interface DateRangePickerProps {
  readonly startDate: string;
  readonly endDate: string;
  readonly labels: {
    readonly from: string;
    readonly to: string;
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
  const [, setParams] = useQueryStates(
    {
      from: parseAsString.withDefault(daysAgo(28)),
      to: parseAsString.withDefault(today()),
    },
    { shallow: false },
  );

  const presets = [
    { label: labels.past7days, days: 7 },
    { label: labels.past28days, days: 28 },
    { label: labels.past90days, days: 90 },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="date-from" className="text-sm text-surface-500">
          {labels.from}
        </label>
        <input
          id="date-from"
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => setParams({ from: e.target.value })}
          className="rounded border border-surface-200 bg-surface-50 px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="date-to" className="text-sm text-surface-500">
          {labels.to}
        </label>
        <input
          id="date-to"
          type="date"
          value={endDate}
          min={startDate}
          max={today()}
          onChange={(e) => setParams({ to: e.target.value })}
          className="rounded border border-surface-200 bg-surface-50 px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-1.5">
        {presets.map((preset) => {
          const presetFrom = daysAgo(preset.days);
          const presetTo = today();
          const isActive = startDate === presetFrom && endDate === presetTo;

          return (
            <button
              key={preset.days}
              type="button"
              onClick={() => setParams({ from: presetFrom, to: presetTo })}
              className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                isActive
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-surface-200 bg-surface-100 text-surface-700 hover:bg-surface-200"
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
